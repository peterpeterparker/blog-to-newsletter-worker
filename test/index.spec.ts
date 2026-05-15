import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import worker from "../src/index";
import { Env } from "../src/common/types";
import { env } from "cloudflare:workers";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const secret = "a".repeat(32);
const validUrl = `https://example.com/telegram/${secret}`;

const makeRequest = (body: unknown, options: { method?: string; url?: string } = {}) => {
  const method = options.method ?? "POST";
  return new IncomingRequest(options.url ?? validUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(method !== "GET" && method !== "HEAD" && { body: JSON.stringify(body) }),
  });
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
  const mockEnv: Env = {
    ...(env as Env),
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 405 for non-POST requests", async () => {
    const request = makeRequest({}, { method: "GET" });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, mockEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(405);
  });

  it("should return 500 if env is misconfigured", async () => {
    const request = makeRequest({});
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, {} as Env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(500);
  });

  it("should return 400 for unknown routes", async () => {
    const request = makeRequest({}, { url: "https://example.com/unknown" });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, mockEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
  });

  it("should route /telegram to TelegramCallback", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    const request = makeRequest(makeCallbackQuery("send:campaign123"));
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, mockEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
  });

  it("should return 403 for /telegram with wrong secret", async () => {
    const request = makeRequest(makeCallbackQuery("send:campaign123"), {
      url: "https://example.com/telegram/wrongsecret",
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, mockEnv, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(403);
  });
});
