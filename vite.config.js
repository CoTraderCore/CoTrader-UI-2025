// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js,ts,tsx}",
    })
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process',
      util: 'util',
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      loader: {
        ".js": "jsx",
      },
    },
  },
})