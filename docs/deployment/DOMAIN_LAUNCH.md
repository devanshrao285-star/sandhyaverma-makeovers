# Launch checklist: sandhyavermamakeovers.online

Status on 9 November 2026: the domain is registered with Hostinger. Cloudflare activation and deployment have not started.

## 1. Activate Cloudflare DNS

1. Create or sign in to the Cloudflare account that will own the website.
2. Choose **Add a site**, enter `sandhyavermamakeovers.online`, and select the Free plan.
3. Confirm the imported DNS records. There is no existing website to preserve, but do not remove email records if you later use Hostinger email.
4. Copy the two nameservers Cloudflare assigns. They are unique to the account; do not copy nameservers from another guide or domain.
5. In Hostinger hPanel, open the domain's nameserver settings and replace the existing nameservers with the two Cloudflare values.
6. Wait for Cloudflare to mark the zone **Active**. Propagation may take up to 24 hours.

If Hostinger shows DNSSEC as enabled, remove its existing DS record before changing nameservers, then enable DNSSEC again from Cloudflare after the zone is active.

## 2. Create Cloudflare resources

Create these resources inside the activated account:

- D1 database: `sandhyaverma-prod`.
- Private R2 Standard bucket: `sandhyaverma-media-private`. Do not enable a public bucket URL or `r2.dev`.
- Turnstile widget for `sandhyavermamakeovers.online` and `www.sandhyavermamakeovers.online`.
- Zero Trust / Access application for `sandhyavermamakeovers.online/admin/*` and `sandhyavermamakeovers.online/api/admin/*`; create an Allow policy for `devanshrao135@gmail.com` only.

R2 includes free usage but Cloudflare currently requires an R2 subscription checkout. Review the billing screen and usage controls before creating the bucket; no paid upgrade is needed for this project at launch scale.

## 3. Deploy from GitHub

1. Create a private GitHub repository and push this project.
2. In Cloudflare, choose **Workers & Pages** → **Create** → **Pages** → connect the repository.
3. Set root directory to the repository root, build command to:

   ```text
   corepack enable && pnpm install --frozen-lockfile && pnpm content:sync && pnpm build
   ```

4. Set output directory to `frontend/dist` and Node version to `24`.
5. Replace the placeholder D1 database ID in `wrangler.toml` with the newly created D1 database ID before the first production deployment. Bind the D1 database as `DB` and the private R2 bucket as `MEDIA`.
6. Apply `backend/migrations/0001_initial.sql` to the remote D1 database.

## 4. Configure variables and secrets

Use `infrastructure/production.vars.example` as the non-secret variable checklist. Start with `PUBLIC_LAUNCH_READY=false` and `FORM_ENABLED=false`.

Add `TURNSTILE_SECRET`, `RATE_SALT`, `BUILD_TOKEN` and `DEPLOY_HOOK` as Pages Secrets. Create the Pages deploy hook only after the first Pages project exists. Set `CONTENT_API_URL` in the Pages build environment to `https://sandhyavermamakeovers.online/api/build/snapshot`.

## 5. Connect the domain and test

In the Pages project, use **Custom domains** → **Set up a domain** and add both `sandhyavermamakeovers.online` and `www.sandhyavermamakeovers.online`. Choose one canonical domain and redirect the other.

Before enabling indexing or live enquiries, verify HTTPS, the enquiry form, Access login, admin content save, media upload, publication, mobile layout, and a 100-concurrent-browser load test. Then set `FORM_ENABLED=true` and `PUBLIC_LAUNCH_READY=true`, redeploy, and submit the sitemap to Google Search Console.
