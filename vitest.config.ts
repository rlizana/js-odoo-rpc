import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/node/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
})
