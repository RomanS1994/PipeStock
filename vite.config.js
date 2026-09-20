import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendEnvDir = path.resolve(__dirname, 'frontend/webApp');
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  plugins: [react()],
  base,
  envDir: frontendEnvDir,
  root: path.resolve(__dirname, 'frontend/webApp'),
  publicDir: 'public',
  appType: 'spa',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend/webApp/src'),
      '@shared': path.resolve(__dirname, 'frontend/shared/src/react-app'),
    },
  },
  build: {
    sourcemap: true,
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
