import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ Polyfill Node.js built-ins for simple-peer
      events: 'events',
      util: 'util',
    },
  },
  define: {
    // ✅ Fix "global is not defined"
    'global': 'window',
    'process.env': {},
  },
  // ✅ Force Vite to pre-bundle these CommonJS dependencies
  optimizeDeps: {
    include: ['simple-peer', 'events', 'util'],
  },
});