
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: "playwright-report",
      },
    ],
  ],

  use: {
    baseURL: "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    headless: true,
  },

  projects: [
    {
      name: "chromium-mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 414,
          height: 896,
        },
      },
    },
  ],

  webServer: {
    command:
      "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",

    url: "http://127.0.0.1:5173",

    reuseExistingServer: !process.env.CI,

    timeout: 60_000,
  },
});
