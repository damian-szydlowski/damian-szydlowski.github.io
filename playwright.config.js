import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  timeout: 35000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:4173",
    browserName: "chromium",
    channel: process.env.BROWSER_CHANNEL || "chrome",
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
