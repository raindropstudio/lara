import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const appDirectory = fileURLToPath(new URL('./app', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': appDirectory,
      '@': appDirectory,
    },
  },
})
