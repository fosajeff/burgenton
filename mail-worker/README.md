# Burgenton mail worker

A tiny Cloudflare Worker that receives the website's form submissions and
sends them as email via [Resend](https://resend.com). It's fully decoupled
from wherever the static site itself is hosted — it just needs to be
reachable over HTTPS, and the site calls it with `fetch()`.

## One-time setup

1. Install dependencies:
   ```sh
   cd mail-worker
   npm install
   ```
2. Log in to Cloudflare (opens a browser window):
   ```sh
   npx wrangler login
   ```
3. Add your Resend API key as a secret (never committed to git):
   ```sh
   npx wrangler secret put RESEND_API_KEY
   ```
   Paste the key when prompted.

## Deploy

```sh
npm run deploy
```

Wrangler prints a URL like `https://burgenton-mail.<your-subdomain>.workers.dev`.

Copy that URL and update the `ENDPOINT` constant at the top of
`../assets/js/form-handler.js` to `https://burgenton-mail.<your-subdomain>.workers.dev/submit`.

## Local testing

```sh
npm run dev
```

Runs the worker on `http://localhost:8787`. Point `ENDPOINT` in
`form-handler.js` at `http://localhost:8787/submit` while testing locally
(and open the site via a local static server, e.g. `python3 -m http.server 8000`,
so its origin matches `ALLOWED_ORIGINS` in `wrangler.toml`).

## Config

All non-secret config lives in `wrangler.toml` under `[vars]`:

- `SALES_EMAIL` / `INFO_EMAIL` — currently both set to a test inbox
  (`okoobohefosa@gmail.com`). Switch to the real `sales@burgenton.com` /
  `info@burgenton.com` addresses when ready, then re-run `npm run deploy`.
- `FROM_EMAIL` — uses Resend's shared sandbox sender
  (`onboarding@resend.dev`) so mail works before any domain is verified.
  Once `burgenton.com` is added and verified in the
  [Resend dashboard](https://resend.com/domains) (a few DNS records), change
  this to something like `Burgenton Website <no-reply@burgenton.com>`.
- `ALLOWED_ORIGINS` — CORS allow-list. Add the production domain once the
  site's real hosting is decided.

## How routing works

Each form on the site submits a hidden `form_type` field. The worker maps
that to a recipient:

| `form_type`                    | Recipient      | Used on                                   |
| ------------------------------ | -------------- | ------------------------------------------ |
| `quote_enquiry`                | `SALES_EMAIL`  | Contact page enquiry form                  |
| `dealer_application`           | `INFO_EMAIL`   | Partners → Dealers                         |
| `distributor_application`      | `INFO_EMAIL`   | Partners → Distributors                    |
| `service_partner_application`  | `INFO_EMAIL`   | Partners → Service Partners                |
| `newsletter_signup`            | `INFO_EMAIL`   | Footer newsletter form (all pages), Resources page subscribe form |

Every email's subject is prefixed with the form's label and the reply-to is
set to the submitter's email, so replying goes straight to them even though
`FROM_EMAIL` is a fixed sender.

## Spam protection

Every form includes a hidden honeypot field (`hp_website`). Real visitors
never see or fill it; if it arrives non-empty the worker silently discards
the submission without sending mail.
