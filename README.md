# blog-to-newsletter-worker

Webhook callbacks for the [blog-to-newsletter-action](https://github.com/peterpeterparker/blog-to-newsletter-action).

A [Kyushu](https://kyushu.dev) worker deployed on your VPS that listens for Telegram button taps — Discard, Approve, or Send Test Email — and calls the Mailchimp API to act on your newsletter draft.

## How it works

You tap a button in Telegram
→ Telegram calls this worker (webhook)
→ Worker calls Mailchimp:

- [🗑 Discard] → deletes the draft
- [✅ Approve & Send] → sends the campaign
- [📧 Send Test Email] → sends a test email (optional)
  → Worker confirms back in Telegram

## Usage

This repo is meant to be **forked**. Once you have your own copy, you can deploy it to your server and wire it up to your Telegram bot.

> [!TIP]
> A Cloudflare Worker implementation is available in the [`cloudflare`](https://github.com/peterpeterparker/blog-to-newsletter-worker/tree/cloudflare) branch if you prefer that approach.

## Deployment

The repo includes a GitHub Actions workflow that builds the worker and publishes it as a GitHub release on every new tag. From there, you can deploy it to any server running [Kyushu](https://kyushu.dev).

## Secrets

Set the following environment variables in your Kyushu server configuration:

| Secret               | Description                               |
| -------------------- | ----------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_SECRET`    | A random string (min 32 chars)            |
| `MAILCHIMP_API_KEY`  | Mailchimp → Account → Extras → API keys   |

## Register the Telegram webhook

Run once after deploying:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-server>/telegram/<TELEGRAM_SECRET>"
```

Verify it worked:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

## Local dev

```bash
pnpm test      # run tests
```

## License

MIT
