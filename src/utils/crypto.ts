import { x25519 } from '@noble/curves/ed25519.js';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export interface PSK {
  presharedKey: string;
}

/** More robust/performant Base64 conversion (avoids String.fromCharCode spread issues) */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
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

/**
 * Generate a new WireGuard X25519 key pair
 * Prefers Web Crypto API when available, falls back to @noble/curves
 */
export async function generateKeyPair(): Promise<KeyPair> {
  // Try native Web Crypto first (best randomness + performance)
  try {
    const keyPair = await crypto.subtle.generateKey({ name: 'X25519' }, true, [
      'deriveKey',
      'deriveBits',
    ]);

    const privateKeyRaw = await crypto.subtle.exportKey('raw', keyPair.privateKey);
    const privateKeyBase64 = bytesToBase64(new Uint8Array(privateKeyRaw));

    const publicKeyBase64 = derivePubKey(privateKeyBase64);

    console.debug('Key pair generated using Web Crypto API');
    return { privateKey: privateKeyBase64, publicKey: publicKeyBase64 };
  } catch (error) {
    console.warn('Web Crypto X25519 not supported, falling back to @noble/curves:', error);
  }

  // Fallback using @noble/curves
  try {
    const privateKeyBytes = x25519.utils.randomSecretKey();
    const privateKeyBase64 = bytesToBase64(privateKeyBytes);
    const publicKeyBase64 = derivePubKey(privateKeyBase64);

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
  return { presharedKey: bytesToBase64(randomBytes) };
}

/** Strict WireGuard key validation (44 chars, correct Base64, 32 bytes decoded) */
export function isValidWireGuardKey(key: string): boolean {
  if (typeof key !== 'string' || key.trim().length !== 44) {
    return false;
  }

  const trimmed = key.trim();

  // More precise regex matching WireGuard key format
  if (!/^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw480]=$/.test(trimmed)) {
    return false;
  }

  try {
    return base64ToBytes(trimmed).length === 32;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid WireGuard private key
 */
export function isValidPrivateKey(key: string): boolean {
  return isValidWireGuardKey(key);
}

/**
 * Validate if a string is a valid WireGuard public key
 */
export function isValidPublicKey(key: string): boolean {
  return isValidWireGuardKey(key);
}

/**
 * Derive public key from private key using Curve25519 (X25519)
 */
export function derivePubKey(privateKeyBase64: string): string {
  try {
    if (!isValidWireGuardKey(privateKeyBase64)) {
      throw new Error('Invalid private key');
    }

    const privateKeyBytes = base64ToBytes(privateKeyBase64);
    const publicKeyBytes = x25519.getPublicKey(privateKeyBytes);

    return bytesToBase64(publicKeyBytes);
  } catch (error) {
    throw new Error(
      `Failed to derive public key: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      }
    );
  }
}
