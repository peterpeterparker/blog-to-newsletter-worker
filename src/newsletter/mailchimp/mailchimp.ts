import { Env } from "../../common/types";
import { MailchimpPayload, MailchimpSendTestEmailCodec, MailchimpTestEmailsPayload } from "./types";
import { NewsletterProvider } from "../_newsletter";

@NewsletterProvider
export class Mailchimp {
  readonly #apiUrl: string;
  readonly #requestHeaders: Record<string, string>;

  private constructor({ apiKey }: { apiKey: string }) {
    const dataCenter = apiKey.split("-").at(-1);

    this.#apiUrl = `https://${dataCenter}.api.mailchimp.com/3.0`;

    this.#requestHeaders = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  static create(env: Env): Mailchimp {
    const { MAILCHIMP_API_KEY } = env;

    return new this({ apiKey: MAILCHIMP_API_KEY });
  }

  async sendCampaign({ campaignId }: MailchimpPayload): Promise<void> {
    const res = await fetch(`${this.#apiUrl}/campaigns/${campaignId}/actions/send`, {
      method: "POST",
      headers: this.#requestHeaders,
    });

    if (!res.ok) {
      throw new Error(`Mailchimp send failed: ${await res.text()}`);
    }
  }

  async deleteCampaign({ campaignId }: MailchimpPayload): Promise<void> {
    const res = await fetch(`${this.#apiUrl}/campaigns/${campaignId}`, {
      method: "DELETE",
      headers: this.#requestHeaders,
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`Mailchimp delete failed: ${await res.text()}`);
    }
  }

  async sendTestEmails({ campaignId, emails }: MailchimpTestEmailsPayload): Promise<void> {
    const res = await fetch(`${this.#apiUrl}/campaigns/${campaignId}/actions/test`, {
      method: "POST",
      headers: this.#requestHeaders,
      body: MailchimpSendTestEmailCodec.decode({ emails }),
    });

    if (!res.ok) {
      throw new Error(`Mailchimp test email failed: ${await res.text()}`);
    }
  }
}
