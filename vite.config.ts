import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: 'bundle-stats.html',
      gzipSize: true,
    }),
  ],
  server: {
    hmr: false,
  },
  build: {
    minify: false,
    cssMinify: false,

    rollupOptions: {
      output: {
        minify: false,
        minifyInternalExports: false,
      },
    },

    rolldownOptions: {
      output: {
        minify: false,
      },
    },
  },
})
