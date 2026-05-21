import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

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
      registerType: 'autoUpdate', // Automatically updates the service worker
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'My Static React PWA',
        short_name: 'ReactPWA',
        display: 'standalone', // Provides native app feel
        // ...icons, theme_color, etc.
      },
      workbox: {
        // Essential for offline capability
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],

  build: {
    target: 'es2022', // Modern browsers
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

      // Strict CSP
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'", // Vite HMR needs inline in dev
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' ws://localhost:* wss://localhost:*",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        // needed for PWA working locally
        "manifest-src 'self'",
        "worker-src 'self'",
      ].join('; '),
    },
  },
});
