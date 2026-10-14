import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Windows'ta bazı araçların yaptığı dosya değişiklikleri kaçmasın diye yoklama ile izle
  server: { host: true, port: 5174, watch: { usePolling: true, interval: 300 } },
  build: { target: 'es2022' },
});
