import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import worker from "../src/index";
import type { WorkerRequest } from "kyushu-types";

const secret = "a".repeat(32);
const validUrl = `https://example.com/telegram/${secret}`;

const makeRequest = (
  body: unknown,
  options: { method?: string; url?: string } = {},
): WorkerRequest => {
  const method = options.method ?? "POST";
  return {
    method: method as WorkerRequest["method"],
    url: options.url ?? validUrl,
    headers: { "Content-Type": "application/json" },
    ...(method !== "GET" && method !== "HEAD" && { body: JSON.stringify(body) }),
  };
};

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

describe("Worker", () => {
  beforeEach(() => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-bot-token");
    vi.stubEnv("TELEGRAM_SECRET", "a".repeat(32));
    vi.stubEnv("MAILCHIMP_API_KEY", "test-mailchimp-key-us21");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("should return 405 for non-POST requests", async () => {
    const response = await worker.fetch(makeRequest({}, { method: "GET" }));
    expect(response.status).toBe(405);
  });

  it("should return 500 if env is misconfigured", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    const response = await worker.fetch(makeRequest({}));
    expect(response.status).toBe(500);
    vi.unstubAllEnvs();
  });

  it("should return 400 for unknown routes", async () => {
    const response = await worker.fetch(makeRequest({}, { url: "https://example.com/unknown" }));
    expect(response.status).toBe(400);
  });

  it("should route /telegram to TelegramCallback", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const response = await worker.fetch(makeRequest(makeCallbackQuery("send:campaign123")));
    expect(response.status).toBe(200);
  });

  it("should return 403 for /telegram with wrong secret", async () => {
    const response = await worker.fetch(
      makeRequest(makeCallbackQuery("send:campaign123"), {
        url: "https://example.com/telegram/wrongsecret",
      }),
    );
    expect(response.status).toBe(403);
  });
});
