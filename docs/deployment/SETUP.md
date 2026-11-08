# Running SandhyaVermaMakeovers

## Local preview

Windows shortcut for the already-prepared checkout: run `.\preview.cmd`. This starts Wrangler directly using an installed Node runtime; `pnpm` does not need to be on the terminal PATH. It does not install dependencies, rebuild the site or change the system PATH. If the Codex runtime cache is later removed, install Node.js 24 or follow the standard setup below.

Use Node 24 and pnpm 11. Install with `pnpm install`, then:

1. Copy `infrastructure/dev.vars.example` to the ignored root `.dev.vars`.
2. `pnpm db:local` creates local D1 tables only.
3. `pnpm build` generates the static website.
4. `pnpm preview` serves the complete app at http://127.0.0.1:4321.

For fast public-page editing, use `pnpm dev`. That Astro-only server does not execute the API; the enquiry form clearly reports that the service is not connected. Rebuild to update the full Pages preview.

The local admin bypass requires both ENVIRONMENT=local, LOCAL_ADMIN=true and a loopback hostname. Never configure LOCAL_ADMIN on a deployed environment. Local R2 and D1 are emulated on disk; no cloud resources or subscriptions are created by these commands.

Checks: `pnpm check`, `pnpm test`, `pnpm build`. With the complete local preview running, `pnpm test:integration` writes one clearly labelled synthetic enquiry and checks API behavior. This is not the 100-user production load test.

## Cloudflare setup when ready to launch

No remote provisioning or deployment has been performed. The domain is `sandhyavermamakeovers.online`, registered with Hostinger. Follow `DOMAIN_LAUNCH.md` to activate Cloudflare before remote setup.

- Create a Pages Git project with repository root as build root, `frontend/dist` as output, and `pnpm content:sync && pnpm build` as build command. The root `functions/` shim forwards API routes to the implementations in `frontend/functions/`.
- Create D1 and replace the placeholder ID in `wrangler.toml`; review then apply the migration to the chosen remote database. Create the requested private R2 Standard bucket only after checking account usage and its billing settings. Do not enable r2.dev or a public bucket domain.
- Configure production variables: ENVIRONMENT=production, SITE_ORIGIN as the exact HTTPS origin, ACCESS_TEAM_DOMAIN, ACCESS_AUD, comma-separated ADMIN_EMAILS, TURNSTILE_SITE_KEY. Secrets: TURNSTILE_SECRET and RATE_SALT.
- Protect /admin and /admin/* plus /api/admin/* with Cloudflare Access. Protect preview environments; test that direct pages.dev hosts cannot bypass API JWT checks. The static admin shell contains no customer data, but protect it as well.
- Enquiries default to disabled in production. Set FORM_ENABLED=true only after contact details and the privacy/retention policy are finalized, Turnstile is configured, and an end-to-end live test succeeds.
- Public build environment: PUBLIC_SITE_URL is the real origin; PUBLIC_LAUNCH_READY=true enables indexing. Do not enable it while demo course/service details or draft policies remain.
- All private API responses are no-store. Static routing includes only /api/*, so public browsing does not invoke Functions.
- Do not enable paid Workers, Images or other add-ons automatically. Follow BUDGET.md for R2 controls and verify all account-level usage.

## Content publishing

Create a Pages deploy hook and configure DEPLOY_HOOK and BUILD_TOKEN as runtime secrets. Configure CONTENT_API_URL=https://YOUR-DOMAIN/api/build/snapshot and the same BUILD_TOKEN in the build environment. No credential is sent to the browser.

Admin Save Draft uses optimistic version checks. Publish records an immutable content snapshot, validates referenced media, reserves one of 100 monthly publication requests, then calls the deploy hook. A queued publication means the hook accepted it; it is not a confirmed deployment. Inspect Cloudflare's build result and the deployed HTML's publication-revision meta tag. The previous successful site survives a failed build.

The sync script reads the latest queued/requested snapshot, downloads approved R2 photos through the authenticated build API, processes them locally into WebP, and writes ignored generated assets. D1 versioned snapshots contain only public content. No enquiries are in the build export. Repeated publishes may be coalesced to the latest revision by the build reader; each requested build consumes quota.

## Current limits before production

- Phone, street address, email, opening hours and current prices have been supplied by the owner. Temporary portfolio imagery, stock-video links and testimonials must be replaced with original, permissioned material before launch. Course details still need confirmation.
- R2 limits are conservative application counters, not Cloudflare spending caps. Counters must be reconciled against account-level usage. Failed reservations remain reserved; no automatic deletion is performed.
- Image headers are checked on upload; full decoding and pixel limits run during publishing. A malformed image can fail publication; it does not replace the live website.
- Email notifications, automatic deployment-status reconciliation, account-level quota alert delivery and scheduled independent backups are not connected yet. Enquiries persist in the inbox; do not promise email delivery.
- Rate limits protect enquiry writes. Free CPU limits, Access validation under load, and the 100-concurrent-user workload still need staging measurements.
- Booking payments, automated WhatsApp, customer accounts and discount redemption are intentionally deferred.
