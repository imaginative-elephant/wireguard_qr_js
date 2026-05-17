import { describe, it, expect, vi } from 'vitest';
import {
  generateKeyPair,
  generatePresharedKey,
  derivePubKey,
  isValidWireGuardKey,
  isValidPrivateKey,
  isValidPublicKey,
} from './crypto';

describe('crypto utilities', () => {
  describe('isValidWireGuardKey (and aliases)', () => {
    const validKey = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopA=';
    it('accepts valid keys', () => {
      expect(isValidWireGuardKey(validKey)).toBe(true);
      expect(isValidPrivateKey(validKey)).toBe(true);
      expect(isValidPublicKey(validKey)).toBe(true);
    });

    it('rejects invalid lengths', () => {
      expect(isValidWireGuardKey('')).toBe(false);
      expect(isValidWireGuardKey('tooShort')).toBe(false);
      expect(isValidWireGuardKey('A'.repeat(42) + '=')).toBe(false); // testing length 43 with padding
      expect(isValidWireGuardKey('A'.repeat(45))).toBe(false); // testing length 45 without padding
      expect(isValidWireGuardKey(validKey.replace('=', ''))).toBe(false); // testing missing padding
    });

    it('rejects invalid characters', () => {
      expect(isValidWireGuardKey(validKey.replace('A', '!'))).toBe(false);
      expect(isValidWireGuardKey(validKey.replace('=', '!'))).toBe(false);
    });

    it('trims whitespace correctly', () => {
      expect(isValidWireGuardKey(`   ${validKey}   `)).toBe(true);
      expect(isValidWireGuardKey(`\t\n${validKey}\n`)).toBe(true);
    });

    it('rejects keys that decode to wrong byte length', () => {
      expect(isValidWireGuardKey('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')).toBe(false);
    });
  });

  describe('derivePubKey', () => {
    it('derives valid public key from private key', async () => {
      const { privateKey, publicKey } = await generateKeyPair();
      const derivedPub = derivePubKey(privateKey);

      expect(derivedPub).toBe(publicKey);
      expect(isValidWireGuardKey(derivedPub)).toBe(true);
      expect(isValidPublicKey(derivedPub)).toBe(true);
    });

    it('throws on invalid private key', () => {
      expect(() => derivePubKey('')).toThrow(/Invalid private key/);
      expect(() => derivePubKey('invalid-key')).toThrow();
      expect(() => derivePubKey('A'.repeat(44))).toThrow();
    });
  });

  describe('generateKeyPair', () => {
    it('returns valid key pair via Web Crypto path', async () => {
      const result = await generateKeyPair();

      expect(isValidPrivateKey(result.privateKey)).toBe(true);
      expect(isValidPublicKey(result.publicKey)).toBe(true);
      expect(result.privateKey.length).toBe(44);
      expect(result.publicKey.length).toBe(44);
      expect(result.privateKey).not.toBe(result.publicKey);
    });

    it('produces consistent public key (direct raw export vs derivePubKey)', async () => {
      const { privateKey, publicKey } = await generateKeyPair();
      const derived = derivePubKey(privateKey);
      expect(derived).toBe(publicKey);
    });

    it('falls back gracefully when Web Crypto fails', async () => {
      const spy = vi
        .spyOn(crypto.subtle, 'generateKey')
        .mockRejectedValueOnce(new Error('Web Crypto X25519 not supported'));

      const result = await generateKeyPair();

      expect(isValidPrivateKey(result.privateKey)).toBe(true);
      expect(isValidPublicKey(result.publicKey)).toBe(true);

      spy.mockRestore();
    });

    it('produces different keys on subsequent calls', async () => {
      const pair1 = await generateKeyPair();
      const pair2 = await generateKeyPair();

      expect(pair1.privateKey).not.toBe(pair2.privateKey);
      expect(pair1.publicKey).not.toBe(pair2.publicKey);
    });
  });

  describe('generatePresharedKey', () => {
    it('returns valid 32-byte PSK', () => {
      const { presharedKey } = generatePresharedKey();
      expect(isValidWireGuardKey(presharedKey)).toBe(true);
      expect(presharedKey.length).toBe(44);
    });

    it('returns unique keys on each call', () => {
      const key1 = generatePresharedKey().presharedKey;
      const key2 = generatePresharedKey().presharedKey;
      const key3 = generatePresharedKey().presharedKey;

      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);
    });
  });
});
