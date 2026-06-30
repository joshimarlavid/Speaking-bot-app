import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig(configEnv => mergeConfig(
  viteConfig(configEnv),
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true
    }
  })
))
