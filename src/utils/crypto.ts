import { x25519 } from '@noble/curves/ed25519.js'

export interface KeyPair {
  privateKey: string
  publicKey: string
}

export interface PSK {
  presharedKey: string
}

/**
 * Convert Uint8Array to base64 string (WireGuard format)
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Generate a new WireGuard key pair using Curve25519 (X25519)
 * Uses the native Web Crypto API for key generation
 */
// export async function generateKeyPair(): Promise<KeyPair> {
//   const keyPair = await crypto.subtle.generateKey(
//     { name: 'X25519' },
//     true, // extractable
//     ['deriveKey', 'deriveBits']
//   )

//   // Export as raw bytes
//   const privateKeyRaw = await crypto.subtle.exportKey('raw', keyPair.privateKey)
//   const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey)

//   return {
//     privateKey: bytesToBase64(new Uint8Array(privateKeyRaw)),
//     publicKey: bytesToBase64(new Uint8Array(publicKeyRaw)),
//   }
// }
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    // Generate private key with Web Crypto (strong native randomness)
    const keyPair = await crypto.subtle.generateKey(
      { name: 'X25519' },
      true,                    // extractable
      ['deriveKey', 'deriveBits']
    );

    const privateKeyRaw = await crypto.subtle.exportKey('raw', keyPair.privateKey);
    const privateKeyBase64 = bytesToBase64(new Uint8Array(privateKeyRaw));

    // Reuse your existing function (this is the reliable part)
    const publicKeyBase64 = derivePubKey(privateKeyBase64);

    console.debug("Key pair generated with Web Crypto");
    return {
      privateKey: privateKeyBase64,
      publicKey: publicKeyBase64,
    };
  } catch (error) {
    console.warn("Web Crypto X25519 export failed, falling back to @noble/curves:", error);
  // Fallback: Pure noble (very reliable)
  try {
    const privateKeyBytes = x25519.utils.randomSecretKey();
    const privateKeyBase64 = bytesToBase64(privateKeyBytes);
    const publicKeyBase64 = derivePubKey(privateKeyBase64);

    console.debug("Key pair generated with @noble/curves fallback");
    return { privateKey: privateKeyBase64, publicKey: publicKeyBase64 };
  } catch (error) {
    console.error("Both key generation methods failed:", error);
    throw new Error("Failed to generate WireGuard key pair");
  }
}
}

/**
 * Generate a preshared key (32 random bytes)
 */
export function generatePresharedKey(): PSK {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return {
    presharedKey: bytesToBase64(randomBytes),
  }
}

/**
 * Validate if a string is a valid WireGuard private key
 */
export function isValidPrivateKey(key: string): boolean {
  try {
    if (!key || key.length !== 44) return false
    // Base64 check
    if (!/^[A-Za-z0-9+/]+=*$/.test(key)) return false
    const decoded = base64ToBytes(key)
    return decoded.length === 32
  } catch {
    return false
  }
}

/**
 * Validate if a string is a valid WireGuard public key
 */
export function isValidPublicKey(key: string): boolean {
  try {
    if (!key || key.length !== 44) return false
    // Base64 check
    if (!/^[A-Za-z0-9+/]+=*$/.test(key)) return false
    const decoded = base64ToBytes(key)
    return decoded.length === 32
  } catch {
    return false
  }
}

/**
 * Derive public key from private key using Curve25519 (X25519)
 */
export function derivePubKey(privateKeyBase64: string): string {
  try {
    if (!isValidPrivateKey(privateKeyBase64)) {
      throw new Error('Invalid private key format')
    }

    const privateKeyBytes = base64ToBytes(privateKeyBase64)

    // Use @noble/curves x25519 getPublicKey to derive the public key
    // x25519.getPublicKey takes a private key and returns the public key
    const publicKeyBytes = x25519.getPublicKey(privateKeyBytes)

    return bytesToBase64(publicKeyBytes)
  } catch (error) {
    throw new Error(`Failed to derive public key: ${error}`)
  }
}

/** Validate WireGuard key format (44 chars base64 with padding) */
export function isValidWireGuardKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  return /^[A-Za-z0-9+/]{43}[=]{1}$/.test(key);
}
