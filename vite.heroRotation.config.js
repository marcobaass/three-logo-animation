import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    root: 'src/',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        lib: {
            entry: resolve(__dirname, 'src/heroRotation.js'),
            name: 'initHeroRotation',
            fileName: 'heroRotation',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
                extend: true,
                globals: {},
            },
        },
    },
})
