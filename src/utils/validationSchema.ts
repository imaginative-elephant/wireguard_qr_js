import { z } from 'zod';
import {
  validateWireGuardKey,
  validateAddress,
  validateDNS,
  validateEndpoint,
  validateAllowedIPs,
  validatePersistentKeepalive,
  validateMTU,
  validatePort,
} from './validators';

const createKeySchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) return;
      const result = validateWireGuardKey(val, fieldName);
      if (!result.isValid) {
        ctx.addIssue({
          code: 'custom',
          message: result.error || `${fieldName} is invalid`,
        });
      }
    });

const peerSchema = z.object({
  id: z.string(),
  publicKey: createKeySchema('Peer Public Key').min(1, 'Peer public key is required'),
  presharedKey: createKeySchema('Pre-Shared Key').optional().or(z.literal('')),
  endpoint: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) return;
      const result = validateEndpoint(val);
      if (!result.isValid)
        ctx.addIssue({ code: 'custom', message: result.error || 'Invalid endpoint' });
    })
    .optional()
    .or(z.literal('')),
  allowedIPs: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) return;
      const result = validateAllowedIPs(val);
      if (!result.isValid)
        ctx.addIssue({ code: 'custom', message: result.error || 'Invalid Allowed IPs' });
    })
    .optional()
    .or(z.literal('')),
  persistentKeepalive: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) return;
      const result = validatePersistentKeepalive(val);
      if (!result.isValid)
        ctx.addIssue({ code: 'custom', message: result.error || 'Invalid PersistentKeepalive' });
    })
    .optional()
    .or(z.literal('')),
  comment: z
    .string()
    .trim()
    .max(200, 'Comment must be 200 characters or less')
    .optional()
    .or(z.literal('')),
});
export const configSchema = z.object({
  interfacePrivateKey: createKeySchema('Private Key').min(1, 'Private key is required'),

  address: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({ code: 'custom', message: 'Address is required' });
        return;
      }
      const result = validateAddress(val);
      if (!result.isValid) {
        ctx.addIssue({ code: 'custom', message: result.error || 'Invalid address' });
      }
    }),

  dns: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) return;
      const result = validateDNS(val);
      if (!result.isValid) {
        ctx.addIssue({ code: 'custom', message: result.error || 'Invalid DNS' });
      }
    })
    .optional()
    .or(z.literal('')),

  listenPort: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) return;
      const result = validatePort(val);
      if (!result.isValid) {
        ctx.addIssue({ code: 'custom', message: result.error || 'Invalid port' });
      }
    })
    .optional()
    .or(z.literal('')),

  mtu: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) return;
      const result = validateMTU(val);
      if (!result.isValid) {
        ctx.addIssue({ code: 'custom', message: result.error || 'Invalid MTU' });
      }
    })
    .optional()
    .or(z.literal('')),

  // Allow 0 or more peers (WireGuard compatible) even though UI enforces 1 or more for useability
  peers: z.array(peerSchema).min(0), // setting to default for clarity
});

export type ConfigFormData = z.infer<typeof configSchema>;
