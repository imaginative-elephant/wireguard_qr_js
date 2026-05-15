# WireGuard QR Code Generator - Developer Guide

This document contains accurate examples of the core utilities based on the current codebase.

## Utils Exports

All utilities are re-exported from `src/utils/index.ts`:

```ts
export * from './crypto';
export * from './validators';
export * from './qr';
export * from './configParser';
export * from './download';
```

You can import everything like this:

```ts
import {
  generateKeyPair,
  generatePresharedKey,
  derivePubKey,
  parseWireGuardConfig,
  generateWireGuardConfig,
  // ... etc
} from '@/utils';
```

## Crypto Utilities (`src/utils/crypto.ts`)

```ts
import { generateKeyPair, generatePresharedKey, derivePubKey } from '@/utils';

// Generate a full key pair (async - prefers Web Crypto API)
const { privateKey, publicKey } = await generateKeyPair();

// Generate a Pre-Shared Key (PSK)
const { presharedKey } = generatePresharedKey();

// Derive public key from a private key
const pubKey = derivePubKey(privateKey);
```

**Key functions:**

- `generateKeyPair()` → Returns `{ privateKey: string, publicKey: string }`
- `generatePresharedKey()` → Returns `{ presharedKey: string }`
- `derivePubKey(privateKeyBase64: string)` → string
- `isValidWireGuardKey(key: string)` / `isValidPrivateKey()` / `isValidPublicKey()`

## Config Parser (`src/utils/configParser.ts`)

```ts
import {
  parseWireGuardConfig,
  generateWireGuardConfig,
  validateWireGuardConfig,
  type WireGuardConfig,
} from '@/utils';

// Parse an existing .conf file
const config: WireGuardConfig = parseWireGuardConfig(fileContent);

// Generate .conf content from the app's config object
const confContent = generateWireGuardConfig(config);

// Basic validation
const errors = validateWireGuardConfig(config);
```

**Main types:**

- `WireGuardConfig` → `{ interface: InterfaceConfig; peers: PeerConfig[] }`
- `InterfaceConfig` and `PeerConfig` are also exported.

## Download Utilities

(Exported from `src/utils/download.ts`)

```ts
import { downloadWireGuardConfig, copyToClipboard } from '@/utils';

// Download as .conf file
downloadWireGuardConfig(confContent, 'my-wireguard.conf');

// Copy text to clipboard
await copyToClipboard(publicKey);
```
