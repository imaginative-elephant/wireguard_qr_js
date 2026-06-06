# Developer Guide

Welcome! This guide covers the codebase, development workflow, and how to extend the application.

## Quick Start for Contributors

```bash
# Clone and setup
git clone https://github.com/imaginative-elephant/wireguard_qr_js.git
cd wireguard_qr_js
npm install

# Development
npm run dev          # Start dev server at http://localhost:5173
npm run lint         # Check code style
npm test             # Run tests
npm run test:watch  # Tests in watch mode

# Building
npm run build        # Production build (dist/)
npm run preview      # Test production build locally
```

## Codebase Overview

### Project Structure

```
src/
├── components/              # React UI components
│   ├── ConfigBuilder.tsx    # Main form component (multi-peer)
│   ├── KeyField.tsx         # Sensitive key input (show/hide, generate)
│   ├── ValidatedInput.tsx   # Validated <input> wrapper
│   ├── QRDisplay.tsx        # QR code + download/copy
│   ├── SettingsModal.tsx    # User settings (e.g., clipboard behavior)
│   ├── Card.tsx             # Reusable card container
│   ├── ErrorBoundary.tsx    # React error boundary
│   └── index.ts             # Component exports
│
├── utils/                   # Security & critical business logic
│   ├── crypto.ts            # Key generation & derivation
│   ├── validators.ts        # Validation functions
│   ├── validationSchema.ts  # Zod schema (uses validation functions)
│   ├── configParser.ts      # .conf file parsing/generation
│   ├── qr.ts                # QR code utilities
│   ├── download.ts          # File download & clipboard helpers
│   └── index.ts             # Utils barrel export
│
├── types/
│   └── wireguard.ts         # WireGuard config types
│
├── assets/                  # Static assets
├── App.tsx                  # App root component
├── App.css                  # Global styles
├── main.tsx                 # React entry point
└── index.css                # Tailwind CSS entry
```

### Key Modules Explained

#### `src/utils/validationSchema.ts` — Form Validation

All validation rules live here using **Zod** (althought currently a passthrough for `validators.ts`):

**Why?**

- Single schema used by both form validation and type generation
- Ensures frontend + validation are always in sync
- No _duplicate_ validation logic in multiple places

#### `src/utils/crypto.ts` — Cryptographic Operations

Handles WireGuard X25519 key operations:

```typescript
// Generate new key pair
const { privateKey, publicKey } = await generateKeyPair();

// Derive public key from existing private key
const publicKey = derivePubKey(privateKeyBase64);

// Generate pre-shared key (optional extra security)
const { presharedKey } = generatePresharedKey();
```

**Implementation Details:**

- Uses Web Crypto API first (native, secure)
- Falls back to `@noble/curves` if unavailable
- All keys returned as base64 strings
- Async function for Web Crypto operations

#### `src/components/ConfigBuilder.tsx` — The Main Form

The heart of the application:

```typescript
export function ConfigBuilder({ clearClipboardAfterCopy }) {
  const form = useForm<ConfigFormData>({
    /* ... */
  });
  const { fields, append, remove } = useFieldArray({ control });

  // Generate keys, update peers, handle uploads, etc.
}
```

**Key Features:**

- Multi-peer management with `useFieldArray()`
- Real-time validation with `useWatch()`
- Auto-focus new peer inputs
- Error boundary wrapping

## Common Development Tasks

### Adding a New Input Field

1. **Add to Zod schema** (`validationSchema.ts`):

```typescript
myNewField: z.string().refine(isValidMyValue, 'Invalid message');
```

2. **Add to form component** (`ConfigBuilder.tsx`):

```typescript
<Controller
  control={control}
  name="myNewField"
  render={({ field }) => (
    <ValidatedInput
      label="My New Field"
      value={field.value || ''}
      onChange={field.onChange}
      error={errors.myNewField?.message}
    />
  )}
/>
```

3. **Update defaults in form component** (`ConfigBuilder.tsx`):

```typescript
  const clearAll = () => {
    reset({
      interfacePrivateKey: '',
      address: '',
      dns: '',
      listenPort: '',
      mtu: '',
      myNewField: '',
      ...
  };
    const loadExample = () => {
    reset({
      interfacePrivateKey: '',
      address: '10.0.0.2/32',
      dns: '1.1.1.1, 9.9.9.9',
      listenPort: '',
      mtu: '',
      myNewField: '',
      ...
  };
  ...

```

4. **Add validator** (`validators.ts` if you plan to call it from `validationSchema.ts`):

```typescript
export function isValidMyValue(value: string): boolean {
  return /* your validation */;
}
```

5. **Add test** (`validationSchema.test.ts` and if applicable `validators.test.ts`):

`validationSchema.test.ts`:

```typescript
    it('test some value', () => {
      const result = configSchema.safeParse({
        interfacePrivateKey: 'not-a-valid-key',
        address: '10.0.0.2/32',
        myNewField: '<some test value>'
        peers: [{ id: '1', publicKey: validPublicKey }],
      });
      expect(result.success).toBe(false);
    });
```

`validators.test.ts`:

```typescript
it('should validate my value', () => {
  expect(isValidMyValue('valid')).toBe(true);
  expect(isValidMyValue('invalid')).toBe(false);
});
```

6. **Update types** (`types/wireguard.ts` if needed)

### Adding a New Component

1. Create `src/components/MyComponent.tsx`:

```typescript
import { FC } from 'react';

export const MyComponent: FC<MyComponentProps> = (props) => {
  return <div>{/* ... */}</div>;
};
```

2. Export from `src/components/index.ts`:

```typescript
export * from './MyComponent';
```

3. Import where needed:

```typescript
import { MyComponent } from '@/components';
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Open interactive test UI
npm run test:ui

# Generate coverage report
npm run test:coverage
# → Opens coverage/index.html in browser
```

**Test File Locations:**

- `src/utils/crypto.test.ts` — Crypto operations
- `src/utils/validators.test.ts` — Validation functions
- `src/components/*.test.tsx` — Component tests

### Debugging Tips

**1. React DevTools**

```bash
# Install React DevTools browser extension
# Then in your app: <Profiler> component performance
```

**2. Check Form State**
In your component:

```typescript
const values = useWatch({ control });
console.log('Current form values:', values);
console.log('Form errors:', formState.errors);
```

**3. Test a Validator Directly**

```bash
# In browser console or Node
import { isValidWireGuardKey } from '@/utils';
isValidWireGuardKey('someKey'); // true or false
```

## API Reference

### Crypto Utilities

```typescript
import { generateKeyPair, generatePresharedKey, derivePubKey } from '@/utils';

// Generate new key pair (async)
const { privateKey, publicKey } = await generateKeyPair();

// Generate pre-shared key
const { presharedKey } = generatePresharedKey();

// Derive public key from private key
const publicKey = derivePubKey(privateKeyBase64);

// Validation helpers
isValidWireGuardKey(key); // → boolean
isValidPrivateKey(key); // → boolean
isValidPublicKey(key); // → boolean
```

### Config Parser

```typescript
import { parseWireGuardConfig, generateWireGuardConfig, type WireGuardConfig } from '@/utils';

// Parse existing .conf file
const config: WireGuardConfig = parseWireGuardConfig(fileContent);

// Generate .conf format from config object
const confContent = generateWireGuardConfig(config);

// Config object structure
interface WireGuardConfig {
  interface: {
    privateKey: string;
    address: string;
    dns?: string;
    listenPort?: number;
    mtu?: number;
  };
  peers: {
    publicKey: string;
    endpoint?: string;
    allowedIps?: string;
    presharedKey?: string;
    persistentKeepalive?: number;
  }[];
}
```

### Download & Clipboard

```typescript
import { downloadWireGuardConfig, copyToClipboard } from '@/utils';

// Download .conf file
downloadWireGuardConfig(confContent, 'my-config.conf');

// Copy to clipboard
try {
  await copyToClipboard('text to copy');
  toast.success('Copied!');
} catch (error) {
  toast.error('Copy failed');
}
```

### Validators

```typescript
import {
  isValidWireGuardKey,
  isValidPrivateKey,
  isValidPublicKey,
  isValidEndpoint,
  isValidCIDR,
  isValidDNS,
  isValidIPAddress,
} from '@/utils';

// Each returns boolean
isValidPrivateKey('privateKeyBase64'); // → true/false
isValidPublicKey('publicKeyBase64'); // → true/false
isValidEndpoint('vpn.example.com:51820'); // → true/false
isValidCIDR('10.0.0.0/24'); // → true/false
isValidDNS('1.1.1.1'); // → true/false
isValidIPAddress('192.168.1.1'); // → true/false
```

## Type System

### ConfigFormData

The form shape (from Zod schema):

```typescript
interface ConfigFormData {
  interfacePrivateKey: string;
  address: string;
  dns: string;
  listenPort: string;
  mtu: string;
  peers: Peer[];
}

interface Peer {
  id: string;
  publicKey: string;
  endpoint: string;
  allowedIPs: string;
  persistentKeepalive: string;
  presharedKey: string;
}
```

## Performance Considerations

### Code Splitting

QRDisplay component is lazy-loaded:

```typescript
const QRDisplay = lazy(() =>
  import('./QRDisplay').then((module) => ({ default: module.QRDisplay }))
);

<Suspense fallback={<LoadingPlaceholder />}>
  <QRDisplay config={fullConfig} />
</Suspense>
```

This means QR rendering code (which is initially non-essential) loads later which improves user‑perceived page load time.

### Memoization

```typescript
// Only recalculate when deps change
const fullConfig = useMemo(() => {
  if (!isConfigFullyValid) return '';
  return generateWireGuardConfig(/* ... */);
}, [isConfigFullyValid /* other deps */]);

// Only re-render when these specific values change
const peers = useMemo(() => values.peers ?? [], [values.peers]);
```

## Build & Deployment

### Production Build

```bash
npm run build
# Output → dist/ directory
# Size: ~127KB gzipped
```

### Docker Build

```bash
docker compose build
docker compose up
# http://localhost:8080
```

Dockerfile uses multi-stage build:

1. Build stage (Node + build deps)
2. Runtime stage (Nginx only, minimal size)

## Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes + commit
git add .
git commit -m "feat: add my feature"

# 3. Push and create PR
git push origin feature/my-feature

# 4. After review, merge to main
# (squash or rebase based on project preference)
```

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `perf:` Performance change
- `docs:` Documentation change
- `refactor:` Code refactor (no logic change)
- `test:` Test additions/updates
- `chore:` Dependency, build config, etc.

## Linting & Formatting

```bash
npm run lint       # Check code style
npm run lint:fix  # Auto-fix style issues
npm run format    # Format code (Prettier)
```

ESLint config covers:

- React best practices
- TypeScript correctness
- a11y (accessibility)
- Next.js rules (where applicable)

## Common Best Practices (for this project)

### 1. Avoid sensitive Data in localStorage

**DON'T:**

```typescript
localStorage.setItem('privateKey', key);
```

**DO:**

```typescript
// Keep in React state only
const [privateKey, setPrivateKey] = useState('');
```

### 2. Unvalidated User Input

**DON'T:**

```typescript
const config = JSON.parse(userInput);
```

**DO:**

```typescript
const config = configSchema.parse(userInput); // Validated + typed
```

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/name`
3. Make changes + tests
4. Run: `npm test && npm run lint && npm run build`
5. Push and create Pull Request

## Getting Help

- [GitHub Discussions](https://github.com/imaginative-elephant/wireguard_qr_js/discussions)
- [GitHub Issues](https://github.com/imaginative-elephant/wireguard_qr_js/issues)
- [Architecture Guide](ARCHITECTURE.md)

---

**Related:**

- [Architecture Guide](ARCHITECTURE.md) — System design & data flow
- [Main README](../README.md) — User documentation
- [WireGuard Official](https://www.wireguard.com/)
