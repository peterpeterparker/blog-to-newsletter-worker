import { z } from "zod";

const TelegramBotAnswerSchema = z.strictObject({
  callbackQueryId: z.string(),
  text: z.string(),
});

export type TelegramBotAnswer = z.infer<typeof TelegramBotAnswerSchema>;

const TelegramBotEditMessageSchema = z.strictObject({
  chatId: z.number(),
  messageId: z.number(),
  text: z.string(),
});

export type TelegramBotEditMessage = z.infer<typeof TelegramBotEditMessageSchema>;

export const AnswerCallbackCodec = z.codec(TelegramBotAnswerSchema, z.string(), {
  decode: ({ callbackQueryId, text }) =>
    JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  encode: (json) => JSON.parse(json),
});

export const EditMessageCodec = z.codec(TelegramBotEditMessageSchema, z.string(), {
  decode: ({ chatId, messageId, text }) =>
    JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  encode: (json) => JSON.parse(json),
});
