import { defineConfig, chromium } from "@playwright/test";
import { existsSync } from "node:fs";
const channel =
  process.env.PLAYWRIGHT_CHANNEL ??
  (!existsSync(chromium.executablePath()) &&
  existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
    ? "chrome"
    : undefined);
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  use: {
    channel,
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  webServer: process.env.REBUILD_SMOKE_SERVER
    ? undefined
    : {
        command: "node node_modules/vite/bin/vite.js",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
      },
});
