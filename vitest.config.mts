import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          TELEGRAM_BOT_TOKEN: "test-bot-token",
          TELEGRAM_SECRET: "a".repeat(32),
          MAILCHIMP_API_KEY: "test-mailchimp-key-us21",
        },
      },
    }),
  ],
  test: {
    watch: false,
  },
});
