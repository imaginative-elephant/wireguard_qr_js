// src/utils/validators.ts

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/** WireGuard private/public key validation */
export function validateWireGuardKey(key: string, fieldName = "Key"): ValidationResult {
  if (!key.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = key.trim();
  if (trimmed.length !== 44) {
    return { isValid: false, error: `${fieldName} must be exactly 44 characters` };
  }

  // Standard WireGuard base64 key regex
  const keyRegex = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw480]=$/;
  if (!keyRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid characters or format` };
  }

  return { isValid: true };
}

/** Endpoint validation (hostname:port or IP:port) */
export function validateEndpoint(endpoint: string): ValidationResult {
  if (!endpoint.trim()) {
    return { isValid: true }; // optional in many cases
  }

  const trimmed = endpoint.trim();
  // IPv4, IPv6, or hostname + port
  const regex = /^(\[?[a-zA-Z0-9.-]+\]?|\[[a-fA-F0-9:]+\]):(\d{1,5})$/;
  
  if (!regex.test(trimmed)) {
    return { isValid: false, error: "Endpoint must be in format: hostname:port or IP:port" };
  }

  const portStr = trimmed.split(':').pop()!;
  const port = parseInt(portStr, 10);
  if (port < 1 || port > 65535) {
    return { isValid: false, error: "Port must be between 1 and 65535" };
  }

  return { isValid: true };
}

/** AllowedIPs validation */
export function validateAllowedIPs(ips: string): ValidationResult {
  if (!ips.trim()) return { isValid: true };

  const parts = ips.split(',').map(p => p.trim()).filter(Boolean);

  const ipRegex = /^((\d{1,3}\.){3}\d{1,3}\/\d{1,2}|([a-fA-F0-9:]+)\/\d{1,3})$/;

  for (const part of parts) {
    if (!ipRegex.test(part)) {
      return { isValid: false, error: `Invalid IP/CIDR: ${part}` };
    }
  }
  return { isValid: true };
}

/** DNS validation (comma-separated IPs) */
export function validateDNS(dns: string): ValidationResult {
  if (!dns.trim()) return { isValid: true };

  const parts = dns.split(',').map(p => p.trim()).filter(Boolean);
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[a-fA-F0-9:]+$/;

  for (const part of parts) {
    if (!ipRegex.test(part)) {
      return { isValid: false, error: `Invalid DNS server: ${part}` };
    }
  }
  return { isValid: true };
}