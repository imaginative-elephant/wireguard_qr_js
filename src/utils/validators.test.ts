import { describe, it, expect } from 'vitest';
import {
  validateWireGuardKey,
  validateEndpoint,
  validateAllowedIPs,
  validateDNS,
} from './validators';

describe('validators', () => {
  describe('validateWireGuardKey', () => {
    it('should validate a correct WireGuard key', () => {
      // A valid base64 key (44 chars)
      const validKey = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopA=';
      const result = validateWireGuardKey(validKey);
      expect(result.isValid).toBe(true);
    });

    it('should accept empty key (required check is done in UI/hook)', () => {
      const result = validateWireGuardKey('');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject key with wrong length', () => {
      const result = validateWireGuardKey('short');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('44 characters');
    });

    it('should reject key with invalid characters', () => {
      const invalidKey = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno!A=';
      const result = validateWireGuardKey(invalidKey);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should use custom field name in error', () => {
      const result = validateWireGuardKey('invalid-key', 'Private Key');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Private Key');
    });
  });

  describe('validateEndpoint', () => {
    it('should allow empty endpoint', () => {
      const result = validateEndpoint('');
      expect(result.isValid).toBe(true);
    });

    it('should validate hostname:port', () => {
      const result = validateEndpoint('vpn.example.com:51820');
      expect(result.isValid).toBe(true);
    });

    it('should validate IPv4:port', () => {
      const result = validateEndpoint('192.168.1.1:51820');
      expect(result.isValid).toBe(true);
    });

    it('should validate IPv6:port', () => {
      const result = validateEndpoint('[2001:db8::1]:51820');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = validateEndpoint('invalid-endpoint');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('format');
    });

    it('should reject port out of range', () => {
      const result = validateEndpoint('example.com:99999');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Port must be between');
    });

    it('should reject port 0', () => {
      const result = validateEndpoint('example.com:0');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAllowedIPs', () => {
    it('should allow empty AllowedIPs', () => {
      const result = validateAllowedIPs('');
      expect(result.isValid).toBe(true);
    });

    it('should validate single IPv4 CIDR', () => {
      const result = validateAllowedIPs('192.168.1.0/24');
      expect(result.isValid).toBe(true);
    });

    it('should validate multiple IPv4 CIDRs', () => {
      const result = validateAllowedIPs('192.168.1.0/24, 10.0.0.0/8');
      expect(result.isValid).toBe(true);
    });

    it('should validate IPv6 CIDR', () => {
      const result = validateAllowedIPs('2001:db8::/32');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid CIDR', () => {
      const result = validateAllowedIPs('192.168.1.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid IP/CIDR');
    });

    it('should reject invalid IP format', () => {
      const result = validateAllowedIPs('invalid.ip');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateDNS', () => {
    it('should allow empty DNS', () => {
      const result = validateDNS('');
      expect(result.isValid).toBe(true);
    });

    it('should validate single IPv4', () => {
      const result = validateDNS('8.8.8.8');
      expect(result.isValid).toBe(true);
    });

    it('should validate multiple IPv4s', () => {
      const result = validateDNS('1.1.1.1, 8.8.8.8');
      expect(result.isValid).toBe(true);
    });

    it('should validate IPv6', () => {
      const result = validateDNS('2001:4860:4860::8888');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid IP', () => {
      const result = validateDNS('invalid.dns');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid DNS server');
    });

    it('should reject domain names', () => {
      const result = validateDNS('dns.google');
      expect(result.isValid).toBe(false);
    });
  });
});

// Additional tests to add

describe('validateEndpoint', () => {
  it('should reject malformed IPv6 without brackets', () => {
    const result = validateEndpoint('2001:db8::1:51820');
    expect(result.isValid).toBe(false);
  });

  it('should reject port with leading zeros in some contexts if desired', () => {
    // optional - most accept 051820
  });

  it('should reject invalid hostname characters', () => {
    const result = validateEndpoint('invalid@host.com:51820');
    expect(result.isValid).toBe(false);
  });
});

describe('validateAllowedIPs', () => {
  it('should reject IPv4 with octet > 255', () => {
    const result = validateAllowedIPs('256.1.2.3/24');
    expect(result.isValid).toBe(false);
  });

  it('should reject CIDR with prefix too large', () => {
    expect(validateAllowedIPs('10.0.0.0/33').isValid).toBe(false);
    expect(validateAllowedIPs('::/129').isValid).toBe(false);
  });

  it('should handle whitespace gracefully', () => {
    const result = validateAllowedIPs('  10.0.0.0/8  ,  fd00::/8  ');
    expect(result.isValid).toBe(true);
  });

  it('should reject malformed CIDR (no slash)', () => {
    expect(validateAllowedIPs('192.168.1.0').isValid).toBe(false);
  });
});

describe('validateDNS', () => {
  it('should reject IPv4 with invalid octet', () => {
    expect(validateDNS('256.256.256.256').isValid).toBe(false);
  });

  it('should reject domains/hostnames', () => {
    expect(validateDNS('dns.google, 1.1.1.1').isValid).toBe(false);
  });
});
