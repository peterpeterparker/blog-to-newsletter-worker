import { describe, it, expect, vi, afterEach } from "vitest";
import { Mailchimp } from "../../../src/newsletter/mailchimp/mailchimp";

const mockEnv = {
  TELEGRAM_BOT_TOKEN: "test-bot-token",
  TELEGRAM_SECRET: "a".repeat(32),
  MAILCHIMP_API_KEY: "test-mailchimp-key-us21",
} satisfies Env;

describe("Mailchimp", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendCampaign", () => {
    it("should call correct endpoint", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));

      await Mailchimp.create(mockEnv).sendCampaign({ campaignId: "campaign123" });

      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("us21.api.mailchimp.com");
      expect(url).toContain("/campaigns/campaign123/actions/send");
      expect(options.method).toBe("POST");
    });

    it("should throw if API fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("Error", { status: 500 }));

      await expect(
        Mailchimp.create(mockEnv).sendCampaign({ campaignId: "campaign123" }),
      ).rejects.toThrow("Mailchimp send failed");
    });
  });

  describe("deleteCampaign", () => {
    it("should call correct endpoint", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(null, { status: 204 }));

      await Mailchimp.create(mockEnv).deleteCampaign({ campaignId: "campaign123" });

      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/campaigns/campaign123");
      expect(options.method).toBe("DELETE");
    });

    it("should not throw on 204", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 204 }));

      await expect(
        Mailchimp.create(mockEnv).deleteCampaign({ campaignId: "campaign123" }),
      ).resolves.toBeUndefined();
    });

    it("should throw if API fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("Error", { status: 500 }));

      await expect(
        Mailchimp.create(mockEnv).deleteCampaign({ campaignId: "campaign123" }),
      ).rejects.toThrow("Mailchimp delete failed");
    });
  });

  describe("sendTestEmails", () => {
    it("should call correct endpoint with correct payload", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));

      await Mailchimp.create(mockEnv).sendTestEmails({
        campaignId: "campaign123",
        emails: ["test@test.com"],
      });

      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/campaigns/campaign123/actions/test");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body as string);
      expect(body.test_emails).toEqual(["test@test.com"]);
      expect(body.send_type).toBe("html");
    });

    it("should throw if API fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("Error", { status: 500 }));

      await expect(
        Mailchimp.create(mockEnv).sendTestEmails({
          campaignId: "campaign123",
          emails: ["test@test.com"],
        }),
      ).rejects.toThrow("Mailchimp test email failed");
    });
  });
});
