import { describe, it, expect, vi, afterEach } from "vitest";
import { Env } from "../../../src/common/types";
import { TelegramCallback } from "../../../src/callback/telegram/telegram";

const mockEnv: Env = {
  TELEGRAM_BOT_TOKEN: "test-bot-token",
  TELEGRAM_SECRET: "a".repeat(32),
  MAILCHIMP_API_KEY: "test-mailchimp-key-us21",
};

const secret = "a".repeat(32);
const validPath = `/telegram/${secret}`;

const makeRequest = (body: unknown, path = validPath) => ({
  method: "POST" as const,
  url: `https://example.com${path}`,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const makeCallbackQuery = (data: string) => ({
  callback_query: {
    id: "query123",
    data,
    message: {
      message_id: 1,
      chat: { id: 12345 },
      text: "New newsletter draft ready",
    },
  },
});

describe("TelegramCallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("handle", () => {
    it("should return 403 if path does not match secret", async () => {
      const request = makeRequest(makeCallbackQuery("send:campaign123"), "/telegram/wrong");
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(403);
    });

    it("should return 200 if request body is invalid", async () => {
      const request = makeRequest({ invalid: "body" });
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(200);
    });

    it("should return 200 OK if no callback_query", async () => {
      const request = makeRequest({});
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(200);
      expect(response.body).toBe("OK");
    });

    it("should return 400 if callback data format is invalid", async () => {
      const request = makeRequest(makeCallbackQuery("invalid-format"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(400);
    });

    it("should handle send action and return 200", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("send:campaign123"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(200);
    });

    it("should handle discard action and return 200", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("discard:campaign123"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(200);
    });

    it("should handle test action and return 200", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("test:campaign123:test@test.com"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(200);
    });

    it("should not edit message after test email is sent", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("test:campaign123:test@test.com"));
      const url = new URL(request.url);

      await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(fetchSpy).toHaveBeenCalledTimes(2);

      const urls = fetchSpy.mock.calls.map(([url]) => url as string);
      expect(urls.some((url) => url.includes("editMessageText"))).toBe(false);
    });

    it("should return 500 if test email fails", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("Error", { status: 500 }))
        .mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("test:campaign123:test@test.com"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(500);
    });

    it("should return 500 if test action has no emails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("test:campaign123"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(500);
    });

    it("should return 500 if send campaign fails", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("Error", { status: 500 }))
        .mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("send:campaign123"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(500);
    });

    it("should return 500 if discard campaign fails", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("Error", { status: 500 }))
        .mockResolvedValue(new Response("{}", { status: 200 }));

      const request = makeRequest(makeCallbackQuery("discard:campaign123"));
      const url = new URL(request.url);

      const response = await TelegramCallback.create(mockEnv).handle({ url, request });

      expect(response.status).toBe(500);
    });
  });
});
