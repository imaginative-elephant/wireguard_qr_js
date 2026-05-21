import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Content Security Policy
 * - Dev Considerations: HMR and Tailwind dev mode
 */
const csp = {
  dev: [
    "default-src 'self'",
    // Required (unsafe-inline) for Vite HMR; unsafe-eval for workbox/PWA
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind JIT
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' ws://localhost:* wss://localhost:*",
    "base-uri 'self'",
    "form-action 'self'",
    // "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
  ].join('; '),
};

export default defineConfig({
  // plugins: [react(), tailwindcss()],
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false,
    }),

    // Brotli compression (better compression)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      compressionOptions: {
        level: 11, // Max compression level for Brotli
      },
      deleteOriginFile: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-512x512-maskable.png',
        'screenshots/**/*.{jpg,jpeg,png}',
      ],
      manifest: {
        name: 'WireGuard QR Generator',
        short_name: 'WG QR',
        description: 'Client-side WireGuard configuration and QR code generator',
        display: 'standalone',
        theme_color: '#0ea5e9',
        background_color: '#0f172a',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/Screenshot-wireguard_qr_js_desktop_qr_showing.png',
            sizes: '1718x2079', // Update with actual size if different
            type: 'image/png',
            form_factor: 'wide', // For desktop / richer install UI
            label: 'WireGuard QR Generator on Desktop',
          },
          {
            src: '/screenshots/Screenshot-wireguard_qr_js_mobile_empty.png',
            sizes: '428x889', // Update with actual size if different
            type: 'image/png',
            form_factor: 'narrow', // For mobile
            label: 'WireGuard QR Generator on Mobile',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
        skipWaiting: true,
        clientsClaim: true,
        inlineWorkboxRuntime: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

  build: {
    target: 'es2022',
    sourcemap: false, // Set to true only for debugging production
    minify: 'oxc', // default
    cssMinify: true,
    chunkSizeWarningLimit: 600,

    // Manual chunks can be enabled later if bundle size grows
    // rollupOptions: {
    //   output: {
    //     // Recommended way in Vite 8+
    //     manualChunks: (id: string) => {
    //       if (id.includes('node_modules')) {
    //         if (id.includes('react') || id.includes('react-dom')) {
    //           return 'vendor-react';
    //         }
    //         // You can add more later:
    //         // if (id.includes('lucide-react')) return 'vendor-icons'
    //         return 'vendor';
    //       }
    //     },
    //   },
    // },
  },

  // Security Headers
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': csp.dev,
    },
  },
});
