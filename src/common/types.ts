import { z } from "zod";

export interface Factory<T> {
  /** @throws {Error} if required configuration is missing */
  create(env: Env): T;
}

export type Result = { status: "success" } | { status: "error"; err: unknown };

export const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_SECRET: z.string().min(32),
  MAILCHIMP_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;
