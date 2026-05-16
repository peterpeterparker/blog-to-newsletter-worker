# blog-to-newsletter-worker

Webhook callbacks for the [blog-to-newsletter-action](https://github.com/peterpeterparker/blog-to-newsletter-action).

A Cloudflare Worker that listens for Telegram button taps — Discard, Approve, or Send Test Email — and calls the Mailchimp API to act on your newsletter draft.

## How it works

You tap a button in Telegram
→ Telegram calls this Worker (webhook)
→ Worker calls Mailchimp:

- [🗑 Discard] → deletes the draft
- [✅ Approve & Send] → sends the campaign
- [📧 Send Test Email] → sends a test email (optional)
  → Worker confirms back in Telegram

## Usage

This repo is meant to be **forked**. Once you have your own copy, you can deploy it to your Cloudflare account and wire it up to your Telegram bot.

## Deployment

The repo includes a GitHub Actions workflow that deploys automatically on push to `main`. You'll need a `CLOUDFLARE_API_TOKEN` secret in your repo — see the [Cloudflare docs](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) for setup instructions.

> [!TIP]
> When creating the `CLOUDFLARE_API_TOKEN`, only **Workers Scripts: Write** and **Account Settings: Read** permissions are needed.

## Secrets

> [!NOTE]
> Login to set secrets and logout once done.

```bash
pnpm exec wrangler login
pnpm exec wrangler logout
```

Then set each secret:

```bash
pnpm exec wrangler secret put TELEGRAM_BOT_TOKEN
pnpm exec wrangler secret put TELEGRAM_SECRET
pnpm exec wrangler secret put MAILCHIMP_API_KEY
```

| Secret               | Description                               |
| -------------------- | ----------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_SECRET`    | A random string (min 32 chars)            |
| `MAILCHIMP_API_KEY`  | Mailchimp → Account → Extras → API keys   |

## Register the Telegram webhook

Run once after deploying:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-worker>.workers.dev/telegram/<TELEGRAM_SECRET>"
```

Verify it worked:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

## Local dev

```bash
pnpm run dev   # local dev with wrangler
pnpm test      # run tests
```

## Why Cloudflare Workers?

The approval step for the [blog-to-newsletter-action](https://github.com/peterpeterparker/blog-to-newsletter-action) requires a persistent webhook endpoint to receive Telegram button callbacks. A Cloudflare Worker is used here because it's free for low traffic and requires no server to maintain. That said, any server or serverless function that can receive HTTP POST requests would work — feel free to build your own endpoint and extend the [blog-to-newsletter-action](https://github.com/peterpeterparker/blog-to-newsletter-action) accordingly.

## License

MIT
