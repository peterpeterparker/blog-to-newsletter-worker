import { type Env, EnvSchema } from "./common/types";
import { TelegramCallback } from "./callback/telegram/telegram";
import type { ExportedHandler } from "kyushu-types";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return {
        status: 405,
        body: "Method Not Allowed",
      };
    }

    const processEnv: Partial<Env> = {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_SECRET: process.env.TELEGRAM_SECRET,
      MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
    };

    const envParsed = EnvSchema.safeParse(processEnv);
    if (!envParsed.success) {
      return {
        status: 500,
        body: "Misconfigured",
      };
    }

    const { data: env } = envParsed;

    const url = URL.parse(request.url);

    if (url === null) {
      return {
        status: 403,
        body: "Forbidden",
      };
    }

    const { pathname } = url;

    if (pathname.startsWith("/telegram")) {
      return await TelegramCallback.create(env).handle({ url, request });
    }

    return {
      status: 400,
      body: "Bad Request",
    };
  },
} satisfies ExportedHandler;
