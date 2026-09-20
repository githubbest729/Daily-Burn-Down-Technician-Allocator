import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// We hand-author manifest.json + service-worker.js ourselves (see /public)
// rather than relying on vite-plugin-pwa's generated ones, so behavior on
// old WebKit (iOS 16.7 / Safari) is fully explicit and auditable.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2018', // safe baseline for iOS 16.7 WebKit
    sourcemap: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 600
  },
  server: {
    host: true
  }
});
