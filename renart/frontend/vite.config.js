import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  base:process.env.VITE_BASE_PATH || "/react-vite-deploy",
  build: {
    outDir: 'dist'
});


