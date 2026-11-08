# Local verification — 9 November 2026

## Observed results

- `pnpm check`: 22 Astro files checked, zero errors/warnings/hints; backend TypeScript check passed.
- `pnpm test`: 8 tests passed. Covers enquiry validation and persistence failures, content prices/slugs, India offer expiry, local-only authentication bypass and origin rejection.
- `pnpm build`: 12 static pages built successfully, including service detail routes and admin. Astro optimizes the transparent logo to small WebP/PNG assets.
- `pnpm test:integration`: 22 local Pages/D1/R2 API checks passed, covering public routes, visible contact details, preview portfolio assets, invalid enquiry rejection, foreign-origin rejection, saved lead visibility, lead status update, draft version conflicts, missing publish configuration, private build authorization and invalid-image rejection.
- `pnpm test:load`: 100 concurrent local public-page reads completed successfully; p95 response time was 895 ms and the run completed in 967 ms.
- Browser: inspected homepage and admin content editor on desktop; checked 390px mobile navigation and contact layout. Submitted a labelled synthetic enquiry through the mobile form and observed it in the local admin inbox. No business notification was sent.
- Owner's supplied wall photo is preserved unchanged; the header/footer/favicon use a cleaned transparent raster interpretation of its monogram.
- After the owner supplied contact details, verified the contact page displays C5B/7A, Janakpuri, New Delhi, Delhi 110058 and +91 96503 60721, with matching telephone, WhatsApp and address-search links. The final local baseline also includes 10:00 AM–5:00 PM and devanshrao135@gmail.com.
- Repaired the admin save workflow after a stale-version conflict and removed the late-loaded module dependency from the JSON editor. The current local admin draft was preserved and saved successfully.
- Added admin-managed, clearly marked preview testimonials and temporary video links; replace them with real client approvals and studio media before launch.

The local database contains clearly labelled test enquiries. These are not production customers.

## Not yet verified

- Cloudflare deployment, Access with real administrator identities, production Turnstile, remote R2 and the authenticated publish/build cycle.
- A deployed 100-concurrent-visitor capacity profile and production CPU/request budget measurements. `pnpm test:load` is a local 100-request smoke test only, not evidence of production capacity.
- Full accessibility audit, search indexing, account-wide billing alerts, scheduled independent backups/restore, and customer email delivery.

Review `deployment/SETUP.md` before enabling live forms or indexing. No deployment, paid subscription or gateway integration was activated during this implementation.
