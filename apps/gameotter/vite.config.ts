import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Gameotter',
        short_name: 'Gameotter',
        description: 'Play Otter RPG cartridges.',
        theme_color: '#111111',
        background_color: '#111111',
        display: 'standalone',
        start_url: '/',
      },
    }),
  ],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@otter/otterfile-core': path.resolve(
        rootDir,
        '../../packages/otterfile-core/src/index.ts',
      ),
      '@otter/game-state': path.resolve(
        rootDir,
        '../../packages/game-state/src/index.ts',
      ),
      '@otter/renderer-api': path.resolve(
        rootDir,
        '../../packages/renderer-api/src/index.ts',
      ),
      '@otter/renderer-demo': path.resolve(
        rootDir,
        '../../packages/renderer-demo/src/index.ts',
      ),
    },
  },
})
