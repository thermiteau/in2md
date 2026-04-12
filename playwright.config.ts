import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  retries: 0,
  workers: 1,

  use: {
    browserName: "firefox",
    headless: false,
    viewport: { width: 1280, height: 900 },
  },

  projects: [
    {
      name: "auth",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "extension",
      testMatch: /extension\.spec\.ts/,
      dependencies: ["auth"],
    },
  ],
})
