import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: './frontend',
  plugins: [react()],
  base:process.env.VITE_BASE_PATH || "/react-vite-deploy",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
