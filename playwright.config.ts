import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
})
