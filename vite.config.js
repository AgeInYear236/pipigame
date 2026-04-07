import { defineConfig } from 'vite';

export default defineConfig({
    // Относительный путь позволяет Electron находить ассеты через file://
    base: './',
    build: {
        target: 'esnext',
        assetsInlineLimit: 0,
        outDir: 'dist',
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext'
        }
    }
});