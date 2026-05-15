import { Env, EnvSchema } from "./common/types";
import { TelegramCallback } from "./callback/telegram/telegram";

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const envParsed = EnvSchema.safeParse(env);
    if (!envParsed.success) {
      return new Response("Misconfigured", { status: 500 });
    }

    const url = URL.parse(request.url);

    if (url === null) {
      return new Response("Forbidden", { status: 403 });
    }

    const { pathname } = url;

    if (pathname.startsWith("/telegram")) {
      return await TelegramCallback.create(env).handle({ url, request });
    }

    return new Response("Bad Request", { status: 400 });
  },
};
