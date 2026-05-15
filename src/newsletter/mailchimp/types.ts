import { z } from "zod";

const MailchimpPayloadSchema = z.strictObject({
  campaignId: z.string(),
});

export type MailchimpPayload = z.infer<typeof MailchimpPayloadSchema>;

export const MailchimpSendTestEmailBodySchema = z.object({
  emails: z.array(z.email()).min(1),
});

const MailchimpTestEmailsPayloadSchema = z.strictObject({
  ...MailchimpPayloadSchema.shape,
  ...MailchimpSendTestEmailBodySchema.shape,
});

export type MailchimpTestEmailsPayload = z.infer<typeof MailchimpTestEmailsPayloadSchema>;

export const MailchimpSendTestEmailCodec = z.codec(MailchimpSendTestEmailBodySchema, z.string(), {
  decode: ({ emails }) =>
    JSON.stringify({
      test_emails: emails,
      send_type: "html",
    }),
  encode: (json) => JSON.parse(json),
});
