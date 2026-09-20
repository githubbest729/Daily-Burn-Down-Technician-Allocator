import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2018',
    sourcemap: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 600
  },
  server: {
    host: true
  }
});
