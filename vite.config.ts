import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'doc',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
