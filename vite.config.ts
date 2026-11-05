import { defineConfig } from 'vite';

export default defineConfig({
    root: 'dev',
    server: { port: 5183, strictPort: true },
    build: { outDir: '../dist-dev', emptyOutDir: true }
});
