import { Env, Result } from "../../common/types";
import { CallbackProvider } from "../_callback";
import {
  CallbackDataSchema,
  TelegramCallbackQuery,
  TelegramUpdateSchema,
  TestCallbackDataSchema,
} from "./types";
import { Mailchimp } from "../../newsletter/mailchimp/mailchimp";
import {
  MailchimpPayload,
  MailchimpSendTestEmailBodySchema,
} from "../../newsletter/mailchimp/types";
import { TelegramBot } from "../../bot/telegram/telegram";
import type { WorkerRequest, WorkerResponse } from "kyushu-types";

@CallbackProvider
export class TelegramCallback {
  #env: Env;
  #secret: string;

  private constructor({ secret, env }: { secret: string; env: Env }) {
    this.#env = env;
    this.#secret = secret;
  }

  static create(env: Env): TelegramCallback {
    const { TELEGRAM_SECRET } = env;

    return new this({
      env,
      secret: TELEGRAM_SECRET,
    });
  }

  async handle({
    url: { pathname },
    request: { body },
  }: {
    url: URL;
    request: WorkerRequest;
  }): Promise<WorkerResponse> {
    if (pathname !== `/telegram/${this.#secret}`) {
      return {
        status: 403,
        body: "Forbidden",
      };
    }

    if (body === undefined) {
      return { status: 400, body: "Missing body" };
    }

    if (typeof body !== "string") {
      return { status: 400, body: "Expected string body" };
    }

    const updateParsed = TelegramUpdateSchema.safeParse(JSON.parse(body));
    if (!updateParsed.success) {
      return {
        status: 400,
        body: "Bad Request",
      };
    }

    const {
      data: { callback_query: callbackQuery },
    } = updateParsed;

    if (callbackQuery === undefined || callbackQuery === null) {
      // The worker might be pinged by Telegram
      return {
        status: 200,
        body: "OK",
      };
    }

    const { data, id: callbackQueryId } = callbackQuery;

    const dataParsed = CallbackDataSchema.safeParse(data);

    if (!dataParsed.success) {
      return {
        status: 400,
        body: "Bad Request",
      };
    }

    const [action, campaignId] = data.split(":");

    const tg = TelegramBot.create(this.#env);

    const exec = async (): Promise<Result> => {
      switch (action) {
        case "send": {
          return await this.#send({ mailchimpPayload: { campaignId }, callbackQuery, tg });
        }
        case "discard": {
          return await this.#discard({ mailchimpPayload: { campaignId }, callbackQuery, tg });
        }
        case "test": {
          return await this.#sendTestEmails({
            mailchimpPayload: { campaignId },
            callbackQuery,
            tg,
          });
        }
        default:
          return { status: "error", err: new Error("Unsupported action") };
      }
    };

    const result = await exec();

    if (result.status === "error") {
      console.error(result.err);

      try {
        await tg.answer({
          callbackQueryId,
          text: `❌ Failed to process "${action}".`,
        });
      } catch (err: unknown) {
        console.error(err);
      }

      return {
        status: 500,
        body: `Cannot execute action ${action}`,
      };
    }

    return {
      status: 200,
      body: "OK",
    };
  }

  async #send({
    mailchimpPayload,
    callbackQuery,
    tg,
  }: {
    mailchimpPayload: MailchimpPayload;
    callbackQuery: Omit<TelegramCallbackQuery, "data">;
    tg: TelegramBot;
  }): Promise<Result> {
    try {
      await Mailchimp.create(this.#env).sendCampaign(mailchimpPayload);

      await tg.answer({
        callbackQueryId: callbackQuery.id,
        text: "✅ Newsletter sent!",
      });

      await tg.editMessage({
        chatId: callbackQuery.message.chat.id,
        messageId: callbackQuery.message.message_id,
        text: `${callbackQuery.message.text}\n\n<b>✅ Sent!</b>`,
      });

      return { status: "success" };
    } catch (err: unknown) {
      return { status: "error", err };
    }
  }

  async #discard({
    mailchimpPayload,
    callbackQuery,
    tg,
  }: {
    mailchimpPayload: MailchimpPayload;
    callbackQuery: Omit<TelegramCallbackQuery, "data">;
    tg: TelegramBot;
  }): Promise<Result> {
    try {
      await Mailchimp.create(this.#env).deleteCampaign(mailchimpPayload);

      await tg.answer({
        callbackQueryId: callbackQuery.id,
        text: "🗑 Draft discarded.",
      });

      await tg.editMessage({
        chatId: callbackQuery.message.chat.id,
        messageId: callbackQuery.message.message_id,
        text: `${callbackQuery.message.text}\n\n<b>🗑 Discarded.</b>`,
      });

      return { status: "success" };
    } catch (err: unknown) {
      return { status: "error", err };
    }
  }

  async #sendTestEmails({
    mailchimpPayload,
    callbackQuery,
    tg,
  }: {
    mailchimpPayload: MailchimpPayload;
    callbackQuery: TelegramCallbackQuery;
    tg: TelegramBot;
  }): Promise<Result> {
    const testDataParsed = TestCallbackDataSchema.safeParse(callbackQuery.data);

    if (!testDataParsed.success) {
      return { status: "error", err: testDataParsed.error };
    }

    const [, , callbackEmails] = testDataParsed.data.split(":");

    const emails = (callbackEmails ?? "").split(",").map((email) => email.trim());

    const emailsParsed = MailchimpSendTestEmailBodySchema.safeParse({ emails });

    if (!emailsParsed.success) {
      return { status: "error", err: emailsParsed.error };
    }

    const { data } = emailsParsed;

    try {
      await Mailchimp.create(this.#env).sendTestEmails({
        ...mailchimpPayload,
        ...data,
      });

      await tg.answer({
        callbackQueryId: callbackQuery.id,
        text: "📧 Test email sent!",
      });

      return { status: "success" };
    } catch (err: unknown) {
      return { status: "error", err };
    }
  }
}
