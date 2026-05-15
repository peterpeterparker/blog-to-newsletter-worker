import { z } from "zod";

const TelegramMessageSchema = z.object({
  message_id: z.number(),
  chat: z.object({ id: z.number() }),
  text: z.string(),
});

const TelegramCallbackQuerySchema = z.object({
  id: z.string(),
  data: z.string(),
  message: TelegramMessageSchema,
});

export type TelegramCallbackQuery = z.infer<typeof TelegramCallbackQuerySchema>;

export const TelegramUpdateSchema = z.object({
  callback_query: TelegramCallbackQuerySchema.optional(),
});

export const CallbackDataSchema = z.string().regex(/^(send|discard|test):[a-zA-Z0-9_-]+(:.+)?$/);

export const TestCallbackDataSchema = z.string().regex(/^test:[a-zA-Z0-9_-]+:.+$/);
