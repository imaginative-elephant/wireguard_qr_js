import { describe, it, expect } from 'vitest';
import {
  validateWireGuardKey,
  validateEndpoint,
  validateAllowedIPs,
  validateAddress,
  validateDNS,
  validatePort,
  validatePersistentKeepalive,
  validateMTU,
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
      expect(validateEndpoint('').isValid).toBe(true);
    });

    it('should validate hostname:port', () => {
      expect(validateEndpoint('vpn.example.com:51820').isValid).toBe(true);
    });

    it('should validate IPv4:port', () => {
      expect(validateEndpoint('192.168.1.1:51820').isValid).toBe(true);
    });

    it('should validate IPv6:port', () => {
      expect(validateEndpoint('[2001:db8::1]:51820').isValid).toBe(true);
    });
    it('should reject malformed IPv6 without brackets', () => {
      const result = validateEndpoint('2001:db8::1:51820');
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid format', () => {
      const result = validateEndpoint('invalid-endpoint');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('format');
    });

    it('should reject invalid hostname characters', () => {
      const result = validateEndpoint('invalid@host.com:51820');
      expect(result.isValid).toBe(false);
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

    it('should reject non-numeric port', () => {
      const result = validateEndpoint('example.com:notaport');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAllowedIPs / validateAddress', () => {
    it('should allow empty values', () => {
      expect(validateAllowedIPs('').isValid).toBe(true);
      expect(validateAddress('').isValid).toBe(true);
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

    it('should reject invalid CIDR (no slash)', () => {
      const result = validateAllowedIPs('192.168.1.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid IP/CIDR');
    });

    it('should reject invalid IP format', () => {
      const result = validateAllowedIPs('invalid.ip');
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid IPv4 with octet > 255', () => {
      const result1 = validateAllowedIPs('192.168.1.256/32');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Invalid IPv4 CIDR');
      const result2 = validateAllowedIPs('256.1.2.3/24');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('Invalid IPv4 CIDR');
    });
  });

  it('should reject CIDR with prefix too large', () => {
    expect(validateAllowedIPs('10.0.0.0/33').isValid).toBe(false);
    expect(validateAllowedIPs('::/129').isValid).toBe(false);
  });

  it('should handle whitespace gracefully', () => {
    const result = validateAllowedIPs('  10.0.0.0/8  ,  fd00::/8  ');
    expect(result.isValid).toBe(true);
  });

  describe('validateDNS', () => {
    it('should allow empty DNS', () => {
      expect(validateDNS('').isValid).toBe(true);
    });

    it('should validate single IPv4', () => {
      const result = validateDNS('9.9.9.9');
      expect(result.isValid).toBe(true);
    });

    it('should validate multiple IPv4s', () => {
      const result = validateDNS('1.1.1.1, 9.9.9.9');
      expect(result.isValid).toBe(true);
    });

    it('should validate IPv6', () => {
      const result = validateDNS('2001:4860:4860::8888');
      expect(result.isValid).toBe(true);
    });
    it('should multiple validate IPv6, mixed', () => {
      expect(validateDNS('2001:4860:4860::8888, 2606:4700:4700::1111').isValid).toBe(true);
      expect(validateDNS('9.9.9.9, 2606:4700:4700::1111').isValid).toBe(true);
    });

    it('should reject invalid IP', () => {
      const result = validateDNS('invalid.dns');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid DNS server');
    });

    it('should reject domain names', () => {
      const result = validateDNS('dns.google');
      expect(result.isValid).toBe(false);
      expect(validateDNS('dns.google, 1.1.1.1').isValid).toBe(false);
    });
    describe('validateDNS', () => {
      it('should reject IPv4 with invalid octet', () => {
        expect(validateDNS('256.256.256.256').isValid).toBe(false);
      });
    });
  });
});

describe('validatePort', () => {
  it('should accept empty port', () => {
    expect(validatePort('').isValid).toBe(true);
  });

  it('should accept valid ports', () => {
    expect(validatePort(51820).isValid).toBe(true);
    expect(validatePort('51820').isValid).toBe(true);
    expect(validatePort(80).isValid).toBe(true);
    expect(validatePort(65535).isValid).toBe(true);
  });

  it('should reject invalid ports', () => {
    expect(validatePort(0).isValid).toBe(false);
    expect(validatePort(65536).isValid).toBe(false);
    expect(validatePort(-1).isValid).toBe(false);
    expect(validatePort('abc').isValid).toBe(false);
  });
});

describe('validatePersistentKeepalive', () => {
  it('should accept empty value', () => {
    expect(validatePersistentKeepalive('').isValid).toBe(true);
  });

  it('should accept valid values', () => {
    expect(validatePersistentKeepalive(0).isValid).toBe(true);
    expect(validatePersistentKeepalive(25).isValid).toBe(true);
    expect(validatePersistentKeepalive(65535).isValid).toBe(true);
  });

  it('should reject invalid values', () => {
    expect(validatePersistentKeepalive(-1).isValid).toBe(false);
    expect(validatePersistentKeepalive(65536).isValid).toBe(false);
    expect(validatePersistentKeepalive('abc').isValid).toBe(false);
  });
});

describe('validateMTU', () => {
  it('should accept empty value', () => {
    expect(validateMTU('').isValid).toBe(true);
  });

  it('should accept valid MTU values', () => {
    expect(validateMTU(1280).isValid).toBe(true);
    expect(validateMTU(1420).isValid).toBe(true);
    expect(validateMTU(1500).isValid).toBe(true);
  });

  it('should reject invalid MTU values', () => {
    expect(validateMTU(1279).isValid).toBe(false);
    expect(validateMTU(9001).isValid).toBe(false);
    expect(validateMTU(68).isValid).toBe(false);
    expect(validateMTU('abc').isValid).toBe(false);
    expect(validateMTU(-1).isValid).toBe(false);
  });
});
