const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "browser",
  testMatch: "*.spec.cjs",
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "verification/browser-results.json" }],
  ],
  use: {
    viewport: { width: 1440, height: 1000 },
    locale: "en-IE",
    reducedMotion: "reduce",
  },
  webServer: process.env.HOTEL_BASE
    ? undefined
    : [
        {
          command: "node server.js",
          url: "http://127.0.0.1:3000",
          reuseExistingServer: false,
        },
        {
          command:
            "python -m http.server 8090 --bind 127.0.0.1 --directory docs",
          url: "http://127.0.0.1:8090",
          reuseExistingServer: false,
        },
      ],
});
