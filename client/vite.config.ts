import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  // TODO: set to your repository name when deploying to GitHub Pages, e.g. '/pku-hydrant-map/'
  base: '/pku-hydrant-map/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173
  }
});
