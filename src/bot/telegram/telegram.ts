import { Env } from "../../common/types";
import { BotProvider } from "../_bot";
import {
  AnswerCallbackCodec,
  EditMessageCodec,
  TelegramBotAnswer,
  TelegramBotEditMessage,
} from "./types";

@BotProvider
export class TelegramBot {
  readonly #apiUrl: string;

  private constructor({ botToken }: { botToken: string }) {
    this.#apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  static create(env: Env): TelegramBot {
    const { TELEGRAM_BOT_TOKEN } = env;

    return new this({ botToken: TELEGRAM_BOT_TOKEN });
  }

  async answer(params: TelegramBotAnswer): Promise<void> {
    const res = await fetch(`${this.#apiUrl}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: AnswerCallbackCodec.decode(params),
    });

    if (!res.ok) {
      throw new Error(`Telegram bot answer failed: ${await res.text()}`);
    }
  }

  async editMessage(params: TelegramBotEditMessage): Promise<void> {
    const res = await fetch(`${this.#apiUrl}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: EditMessageCodec.decode(params),
    });

    if (!res.ok) {
      throw new Error(`Telegram bot edit message failed: ${await res.text()}`);
    }
  }
}
