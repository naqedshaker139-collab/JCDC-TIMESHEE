import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // expose to LAN
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // point to your local Flask backend
        changeOrigin: true,
      },
    },
  },
});