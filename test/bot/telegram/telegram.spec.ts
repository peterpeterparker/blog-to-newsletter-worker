import { describe, it, expect, vi, afterEach } from "vitest";
import { TelegramBot } from "../../../src/bot/telegram/telegram";
import { Env } from "../../../src/common/types";

const mockEnv: Env = {
  TELEGRAM_BOT_TOKEN: "test-bot-token",
  TELEGRAM_SECRET: "a".repeat(32),
  MAILCHIMP_API_KEY: "test-mailchimp-key-us21",
};

describe("TelegramBot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("answer", () => {
    it("should call answerCallbackQuery with correct payload", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));

      await TelegramBot.create(mockEnv).answer({
        callbackQueryId: "query123",
        text: "✅ Done!",
      });

      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("test-bot-token");
      expect(url).toContain("answerCallbackQuery");

      const body = JSON.parse(options.body as string);
      expect(body.callback_query_id).toBe("query123");
      expect(body.text).toBe("✅ Done!");
    });

    it("should throw if Telegram API fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401 }),
      );

      await expect(
        TelegramBot.create(mockEnv).answer({ callbackQueryId: "query123", text: "test" }),
      ).rejects.toThrow("Telegram bot answer failed");
    });
  });

  describe("editMessage", () => {
    it("should call editMessageText with correct payload", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));

      await TelegramBot.create(mockEnv).editMessage({
        chatId: 12345,
        messageId: 67890,
        text: "<b>Updated</b>",
      });

      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("test-bot-token");
      expect(url).toContain("editMessageText");

      const body = JSON.parse(options.body as string);
      expect(body.chat_id).toBe(12345);
      expect(body.message_id).toBe(67890);
      expect(body.text).toBe("<b>Updated</b>");
      expect(body.parse_mode).toBe("HTML");
    });

    it("should throw if Telegram API fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("Error", { status: 500 }));

      await expect(
        TelegramBot.create(mockEnv).editMessage({ chatId: 1, messageId: 2, text: "test" }),
      ).rejects.toThrow("Telegram bot edit message failed");
    });
  });
});
