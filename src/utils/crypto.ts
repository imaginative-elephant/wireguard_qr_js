import { x25519 } from '@noble/curves/ed25519.js';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export interface PSK {
  presharedKey: string;
}

/** Safe Base64 encoding (avoids String.fromCharCode spread issues) */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Convert base64url (used by JWK) to Uint8Array */
function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return base64ToBytes(base64);
}

/** Securely wipe sensitive buffer from memory */
function zeroize(buffer: Uint8Array | null | undefined): void {
  if (buffer?.length) {
    buffer.fill(0);
  }
}

/**
 * Generate a new WireGuard X25519 key pair
 * Prefers Web Crypto API (via JWK + direct raw public), falls back to @noble/curves
 */
export async function generateKeyPair(): Promise<KeyPair> {
  // Try native Web Crypto first (best randomness + performance)
  try {
    const keyPair = await crypto.subtle.generateKey({ name: 'X25519' }, true, [
      'deriveKey',
      'deriveBits',
    ]);

    // Export private key as JWK
    const privateJWK = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    if (!privateJWK.d) {
      throw new Error('JWK missing private material');
    }

    const privateKeyBytes = base64UrlToBytes(privateJWK.d);
    const privateKeyBase64 = bytesToBase64(privateKeyBytes);

    // Export public key directly via Web Crypto
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64 = bytesToBase64(new Uint8Array(publicKeyRaw));

    zeroize(privateKeyBytes);

    console.debug('Key pair generated using Web Crypto API (JWK + raw public)');
    return { privateKey: privateKeyBase64, publicKey: publicKeyBase64 };
  } catch (error) {
    console.debug('Web Crypto X25519 not supported, falling back to @noble/curves:', error);
  }

  // Fallback using @noble/curves
  try {
    const privateKeyBytes = x25519.utils.randomSecretKey();
    const privateKeyBase64 = bytesToBase64(privateKeyBytes);
    const publicKeyBase64 = derivePubKey(privateKeyBase64);

    zeroize(privateKeyBytes);

    console.debug('Key pair generated using @noble/curves');
    return { privateKey: privateKeyBase64, publicKey: publicKeyBase64 };
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('Failed to generate WireGuard key pair. Please try again.', {
      cause: error,
    });
  }
}

/**
 * Generate a 32-byte WireGuard preshared key
 */
export function generatePresharedKey(): PSK {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const pskBase64 = bytesToBase64(randomBytes);
  zeroize(randomBytes);

  return { presharedKey: pskBase64 };
}

/** Strict WireGuard key validation */
export function isValidWireGuardKey(key: string): boolean {
  if (typeof key !== 'string' || key.trim().length !== 44) return false;

  const trimmed = key.trim();
  if (!/^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw480]=$/.test(trimmed)) return false;

  try {
    return base64ToBytes(trimmed).length === 32;
  } catch {
    return false;
  }
}

export const isValidPrivateKey = isValidWireGuardKey;
export const isValidPublicKey = isValidWireGuardKey;

/**
 * Derive public key from private key using @noble/curves
 */
export function derivePubKey(privateKeyBase64: string): string {
  let privateKeyBytes: Uint8Array | null = null;

  try {
    if (!isValidWireGuardKey(privateKeyBase64)) {
      throw new Error('Invalid private key');
    }

    privateKeyBytes = base64ToBytes(privateKeyBase64);
    const publicKeyBytes = x25519.getPublicKey(privateKeyBytes);

    return bytesToBase64(publicKeyBytes);
  } catch (error) {
    throw new Error(
      `Failed to derive public key: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  } finally {
    zeroize(privateKeyBytes);
  }
}
