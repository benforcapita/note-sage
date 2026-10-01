import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt', injectRegister: false,
    includeAssets: ['mask-icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png'],
    manifest: {
      name: 'NoteSage — A space for your thoughts', short_name: 'NoteSage',
      description: 'A private, offline chat-style notebook with a local notes helper. No account needed.',
      theme_color: '#456a4f', background_color: '#fbfcf8', display: 'standalone', scope: '/', start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'], cleanupOutdatedCaches: true, navigateFallback: 'index.html' },
    devOptions: { enabled: false },
  })],
});
