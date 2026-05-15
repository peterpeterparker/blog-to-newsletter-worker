import type { Factory } from "../common/types.ts";
import { MailchimpPayload, MailchimpTestEmailsPayload } from "./mailchimp/types";

interface Newsletter {
  sendCampaign(params: MailchimpPayload): Promise<void>;
  deleteCampaign(params: MailchimpPayload): Promise<void>;
  sendTestEmails(params: MailchimpTestEmailsPayload): Promise<void>;
}

export function NewsletterProvider(_constructor: Factory<Newsletter>) {}
