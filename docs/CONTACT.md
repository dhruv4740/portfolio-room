# Phone contact ("Message" app)

On the room phone, the **Message** icon opens a call screen ("Dhruv, incoming", rings for up to 9 s or until
Answer), then a short form (name, email, message of 5 to 1000 characters). It posts to `POST /api/contact`
(`functions/api/contact.js`, UI in `src/v3/desktop/phone-apps/ContactApp.jsx`). Deep link: `/#/phone/contact`.

## What happens to a message

1. Validated (email shape, length), same-origin only, honeypot field (bots that fill it get a fake success and nothing is stored).
2. Per-visitor cap of 3 a day (`CONTACT_VISITOR_CAP`), keyed by a hash of IP + day, raw IP never stored.
3. Saved in the `ASK_KV` namespace as `msg:<timestamp>-<id>` for 90 days (already bound, no setup).
4. If `RESEND_API_KEY` is set, also emailed to `CONTACT_TO` (default: the address in `src/v3/content/index.js`) with
   `reply_to` set to the visitor, so replying goes to them.
5. If the server cannot take it (no KV and no key, a 5xx, or the daily cap), the form shows a prefilled `mailto:` link.

Without any setup, messages are saved but nothing notifies the owner, so do step 1 below.

## Owner steps (free)

1. Email delivery: sign up at resend.com (free tier, 3,000 mails a month, no card). Create an API key, then in
   Workers & Pages → dhruvkothari → Settings → Variables and Secrets add secret `RESEND_API_KEY` (Production and
   Preview) and redeploy. Until a domain is verified in Resend, the sandbox sender `onboarding@resend.dev` can only send
   to the address the Resend account was created with, so sign up with the same address as `CONTACT_TO` (or set
   `CONTACT_TO` to it). Cloudflare Email Routing/Email Workers was not used because it needs a custom domain and this
   site is on `*.pages.dev`.
2. Optional: `CONTACT_FROM` (a verified sender), `CONTACT_VISITOR_CAP`.
3. Read saved messages any time: `npx wrangler kv key list --namespace-id 882512127d404b9f93285e3248c067f1 --prefix msg: --remote`
   then `npx wrangler kv key get <key> --namespace-id 882512127d404b9f93285e3248c067f1 --remote`.

No Turnstile on this form: the honeypot and the cap are the only abuse controls. Add Turnstile the same way as in
`docs/ASK.md` if spam appears.

## Tests

`node scripts/test-contact.mjs`: saved without Resend, forwarded with `reply_to`, Resend failure still saved, 503 with
nothing configured, validation, honeypot, cap, cross-origin, HTML escaped in the mail.
