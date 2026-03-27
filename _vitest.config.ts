import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    diff: {
      expand: true,
      truncateThreshold: 0,
      printBasicPrototype: false,
    },
  },
})
