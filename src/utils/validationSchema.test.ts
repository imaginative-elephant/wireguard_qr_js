import { describe, it, expect } from 'vitest';
import { configSchema } from './validationSchema';

const validPrivateKey = 'X5OsZUEV0i1FBSobWXtxlqbHs5FYXCbT2idCCMQyQa4=';
const validPublicKey = 'HM8mQqDRwmryKFpFzNa80edAMRf4drh2VkTzidscryY=';

describe('validationSchema', () => {
  describe('Full Valid Config', () => {
    it('accepts a complete valid configuration', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        dns: '1.1.1.1, 8.8.8.8',
        listenPort: '51820',
        mtu: '1420',
        peers: [
          {
            id: '1',
            publicKey: validPublicKey,
            endpoint: 'vpn.example.com:51820',
            allowedIPs: '0.0.0.0/0, ::/0',
            persistentKeepalive: '25',
            presharedKey: '',
          },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('interfacePrivateKey', () => {
    it('rejects empty private key', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: '',
        address: '10.0.0.2/32',
        peers: [{ id: '1', publicKey: validPublicKey }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid private key format', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: 'not-a-valid-key',
        address: '10.0.0.2/32',
        peers: [{ id: '1', publicKey: validPublicKey }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('address', () => {
    it('rejects empty address', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '',
        peers: [{ id: '1', publicKey: validPublicKey }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid IPv4 CIDR', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '1.1.1.256/32',
        peers: [{ id: '1', publicKey: validPublicKey }],
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid IPv6 CIDR', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: 'fd00::1/64',
        peers: [{ id: '1', publicKey: validPublicKey }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('peers', () => {
    it('rejects peer with empty public key', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        peers: [{ id: '1', publicKey: '' }],
      });
      expect(result.success).toBe(false);
    });

    it('accepts multiple peers', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        peers: [
          { id: '1', publicKey: validPublicKey, endpoint: 'peer1.com:51820' },
          { id: '2', publicKey: validPublicKey, allowedIPs: '10.0.1.0/24' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
  it('accepts multiple peers (minimum values)', () => {
    const result = configSchema.safeParse({
      interfacePrivateKey: validPrivateKey,
      address: '10.0.0.2/32',
      peers: [
        { id: '1', publicKey: validPublicKey },
        { id: '2', publicKey: validPublicKey },
      ],
    });
    expect(result.success).toBe(true);
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('trims whitespace on keys and fields', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: `  ${validPrivateKey}  `,
        address: '  10.0.0.2/32  ',
        peers: [{ id: '1', publicKey: `  ${validPublicKey}  ` }],
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid persistentKeepalive', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        peers: [{ id: '1', publicKey: validPublicKey, persistentKeepalive: '-10' }],
      });
      expect(result.success).toBe(false);
    });
    it('handles very long inputs gracefully', () => {
      const longKey = 'a'.repeat(100);
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        peers: [{ id: '1', publicKey: longKey }],
      });
      expect(result.success).toBe(false);
    });

    it('accepts multiple DNS servers with spaces', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        dns: '1.1.1.1, 8.8.8.8, 9.9.9.9',
        peers: [{ id: '1', publicKey: validPublicKey }],
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid preshared key', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        peers: [{ id: '1', publicKey: validPublicKey, presharedKey: 'invalid-psk' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid persistentKeepalive values', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        peers: [{ id: '1', publicKey: validPublicKey, persistentKeepalive: '-5' }],
      });
      expect(result.success).toBe(false);
    });

    it('allow empty peers array (even though UI rejects it)', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: validPrivateKey,
        address: '10.0.0.2/32',
        peers: [],
      });
      expect(result.success).toBe(true);
    });
  });
});
