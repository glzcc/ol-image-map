import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue(), react()],
  server: {
    port: 41733,
    strictPort: true
  },
  build: {
    outDir: 'dist-demo'
  }
});
