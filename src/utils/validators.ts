// src/utils/validators.ts

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/** WireGuard private/public key validation */
export function validateWireGuardKey(key: string, fieldName = 'Key'): ValidationResult {
  const trimmed = key?.trim();
  if (!trimmed) {
    return { isValid: true };
  }

  if (trimmed.length !== 44) {
    return { isValid: false, error: `${fieldName} must be exactly 44 characters` };
  }

  // Standard WireGuard base64 key regex
  const keyRegex = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw480]=$/;
  if (!keyRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid characters or format` };
  }
  try {
    const decoded = atob(trimmed);
    if (decoded.length !== 32) {
      return { isValid: false, error: `${fieldName} must decode to 32 bytes` };
    }
  } catch {
    return { isValid: false, error: `${fieldName} is not valid Base64` };
  }

  return { isValid: true };
}

/** Endpoint validation (hostname:port or IP:port) */
export function validateEndpoint(endpoint: string): ValidationResult {
  const trimmed = endpoint?.trim();
  if (!trimmed) return { isValid: true };

  // Support both IPv4 and IPv6 with port
  const ipv6WithPort = /^\[([0-9a-fA-F:]+)\]:(\d+)$/;
  const ipv4OrHostWithPort = /^([A-Za-z0-9.-]+|\d{1,3}(\.\d{1,3}){3}):(\d+)$/;

  let match = trimmed.match(ipv6WithPort);
  if (match) {
    const port = parseInt(match[2], 10);
    return port >= 1 && port <= 65535
      ? { isValid: true }
      : { isValid: false, error: 'Port must be between 1 and 65535' };
  }

  match = trimmed.match(ipv4OrHostWithPort);
  if (match) {
    const port = parseInt(match[3], 10);
    return port >= 1 && port <= 65535
      ? { isValid: true }
      : { isValid: false, error: 'Port must be between 1 and 65535' };
  }

  return {
    isValid: false,
    error: 'Endpoint must be in format: hostname:port or [IPv4/6]:port',
  };
}
/** Interface Address validation (same rules as AllowedIPs) */
export function validateAddress(address: string): ValidationResult {
  return validateAllowedIPs(address);
}

/** AllowedIPs validation */
export function validateAllowedIPs(ips: string): ValidationResult {
  const trimmed = ips?.trim();
  if (!trimmed) return { isValid: true };

  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { isValid: true };
  }

  // More robust IPv4/IPv6 CIDR regex
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$|^([a-fA-F0-9:]+)\/\d{1,3}$/;

  for (const part of parts) {
    if (!cidrRegex.test(part)) {
      return { isValid: false, error: `Invalid IP/CIDR: ${part}` };
    }

    // Additional IPv4 range check
    if (part.includes('.')) {
      const [ip, prefix] = part.split('/');
      const octets = ip.split('.').map(Number);
      if (octets.some((o) => o < 0 || o > 255) || Number(prefix) > 32) {
        return { isValid: false, error: `Invalid IPv4 CIDR: ${part}` };
      }
    } else {
      // IPv6 prefix check
      const prefix = Number(part.split('/')[1]);
      if (prefix > 128) {
        return { isValid: false, error: `Invalid IPv6 prefix: ${part}` };
      }
    }
  }

  return { isValid: true };
}

/** DNS validation (comma-separated IPs) */
export function validateDNS(dns: string): ValidationResult {
  const trimmed = dns?.trim();
  if (!trimmed) return { isValid: true };

  const parts = dns
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { isValid: true };
  }

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[a-fA-F0-9:]+$/;

  for (const part of parts) {
    if (!ipRegex.test(part)) {
      return { isValid: false, error: `Invalid DNS server: ${part}` };
    }

    // Extra IPv4 octet validation
    if (part.includes('.')) {
      const octets = part.split('.').map(Number);
      if (octets.some((o) => o < 0 || o > 255)) {
        return { isValid: false, error: `Invalid IPv4 address: ${part}` };
      }
    }
  }

  return { isValid: true };
}
