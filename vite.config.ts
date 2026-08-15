import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // Crucial for Electron local file:// loading relative asset URLs
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/.agents/**', '**/.git/**']
    }
  }
});
