# WireGuard QR Code Generator

A **100% client-side** React application for generating WireGuard VPN configurations and QR codes. All cryptographic operations happen in your browser—private keys never leave your device.

## Features

✅ **Client-Side Only** - All processing happens in your browser  
✅ **No Backend** - No server communication, no data collection  
✅ **Secure Key Generation** - Generate WireGuard key pairs locally  
✅ **QR Code Generation** - Scan configs directly into WireGuard mobile apps  
✅ **Config Upload** - Parse existing `.conf` files  
✅ **Download Configs** - Export complete WireGuard client configurations  
✅ **Offline Support** - Works completely offline  
✅ **TypeScript** - Type-safe codebase  
✅ **Tested** - Comprehensive unit tests  

## Technology Stack

- **React 19.2** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (fast development and production builds)
- **wireguard-keygen** - WireGuard-compatible key generation
- **qrcode.react** - QR code rendering
- **js-base64** - Base64 encoding/decoding
- **ini** - `.conf` file parsing
- **Vitest** - Testing framework

## Security

- ✅ No private keys transmitted
- ✅ No externally callable APIs
- ✅ Memory-only state (React state)
- ✅ No localStorage for sensitive data
- ✅ Autocomplete disabled on sensitive fields
- ✅ Open source and auditable
- ✅ Works offline

## Installation

```bash
git clone https://github.com/your-username/wireguard_qr_js.git
cd wireguard_qr_js
npm install
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Check test coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── KeyGenerator.tsx      # Key pair and PSK generation
│   ├── QRDisplay.tsx         # QR code display and download
│   └── index.ts              # Component exports
├── utils/
│   ├── crypto.ts             # WireGuard key generation
│   ├── qr.ts                 # QR code utilities
│   ├── configParser.ts       # .conf file parsing
│   ├── download.ts           # File download helpers
│   └── index.ts              # Utils exports
├── App.tsx                   # Main application
└── main.tsx                  # React entry point
```

## Usage

1. **Generate Key Pair**
   - Click "Generate New Key Pair" in the Key Generator section
   - Your public key is displayed (share with server admin)
   - Private key is hidden but stored securely

2. **Generate Pre-Shared Key (PSK)**
   - Click "Generate PSK" for additional symmetric encryption

3. **Generate QR Code**
   - Once you have a configuration, click "Generate QR Code"
   - Scan with your WireGuard mobile app

4. **Download Configuration**
   - Export configurations as `.conf` files for manual setup

5. **Upload Existing Config**
   - Parse existing `.conf` files to populate forms

## API Methods

### Crypto Utils

```typescript
import { generateKeyPair, generatePresharedKey, derivePublicKey } from '@/utils'

// Generate a new key pair
const { privateKey, publicKey } = generateKeyPair()

// Generate a preshared key
const { presharedKey } = generatePresharedKey()

// Derive public key from private key
const pubKey = derivePublicKey(privateKey)
```

### Config Parser

```typescript
import {
  parseWireGuardConfig,
  generateWireGuardConfig,
  validateWireGuardConfig,
} from '@/utils'

// Parse a .conf file
const config = parseWireGuardConfig(fileContent)

// Generate .conf content
const confContent = generateWireGuardConfig(config)

// Validate configuration
const errors = validateWireGuardConfig(config)
```

### Download Utils

```typescript
import { downloadWireGuardConfig, copyToClipboard } from '@/utils'

// Download config file
downloadWireGuardConfig(configContent, 'my-config.conf')

// Copy to clipboard
await copyToClipboard(publicKey)
```

## Example Configuration

```ini
[Interface]
Address = 10.200.200.3/32
PrivateKey = [Client's private key]
DNS = 8.8.8.8

[Peer]
PublicKey = [Server's public key]
PresharedKey = [Pre-shared key]
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 21
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Best Practices

1. Always use **HTTPS** in production
2. Keep browsers and OS updated
3. Don't share private keys or PSKs
4. Verify server certificates
5. Use strong DNS providers
6. Test configurations before deployment
7. Rotate keys periodically

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- crypto.ts

# Generate coverage report
npm run test:coverage
```

## Deployment

The app can be deployed to any static hosting:

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Docker
```bash
docker build -t wireguard-qr .
docker run -p 3000:3000 wireguard-qr
```

### GitHub Pages
```bash
# Update package.json with your repository
npm run build
# Deploy the dist/ folder
```

## Environment Variables

Optional configuration via `.env`:

```
VITE_APP_TITLE=WireGuard QR Generator
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## Performance

- ⚡ Vite provides ~10x faster build times
- 🚀 ~50KB gzipped bundle size
- 📱 Mobile-optimized UI
- ♻️ React.memo optimized components

## License

[Add your license here]

## Security Disclaimer

This application is provided as-is. While we've implemented security best practices:

- Always review the source code
- Run security audits on dependencies regularly
- Use HTTPS in production
- Never share private keys
- Test thoroughly before production use

## Support

- 📝 [GitHub Issues](https://github.com/your-username/wireguard_qr_js/issues)
- 💬 [GitHub Discussions](https://github.com/your-username/wireguard_qr_js/discussions)

## Related Projects

- [wireguard-qr-go](https://github.com/imaginative-elephant/wireguard-qr-go) - Go backend version
- [WireGuard Official](https://www.wireguard.com/)
- [WireGuard iOS](https://apps.apple.com/app/wireguard/id1451685025)
- [WireGuard Android](https://play.google.com/store/apps/details?id=com.wireguard.android)

---

**Remember**: Your private keys stay in your device. This application generates them locally and never transmits them anywhere.
```
