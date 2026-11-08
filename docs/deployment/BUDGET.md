# Domain-only launch budget

Updated 7 November 2026. This supersedes the INR 1,000/month allowance and paid Workers fallback. Target: domain registration/renewal is the only expense. The owner selected R2 within its free allowance. R2 has metered overages, so an absolute zero-cost guarantee is not possible.

## Launch services

| Component | Approach | Constraint |
| --- | --- | --- |
| Website | Astro static output on Pages Free | 500 builds/month, 20,000 files/site, 25 MiB/file |
| API | Pages Functions / Workers Free; API routes only | Shared 100,000 requests/day; 10 ms CPU/request |
| Database | D1 Free | 500 MB/database; 5 GB/account; 5 million rows read/day; 100,000 written/day |
| Media source | Private R2 Standard | 10 GB-month storage, 1 million Class A and 10 million Class B operations/month included |
| Media delivery | Copy approved photos to Pages during publishing | Visitor image traffic does not access R2 |
| Staff login | Cloudflare Access Free | Up to 50 staff identities, not browsing visitors |
| Form protection | Turnstile Free, validation and rate limits | Combine controls; no complete abuse guarantee |
| Email | Optional Resend Free | 3,000/month, 100/day; persist enquiries regardless |
| Follow-up | Phone and WhatsApp click-to-chat/manual replies | No messaging API automation initially |
| Domain | Paid registration and renewal | Only planned purchase |

No paid theme, CMS subscription, SMS OTP, video hosting or runtime image transformation is required. Existing internet/device costs, development labor and any existing coding-tool subscription are separate from this hosting estimate.

## R2 controls to implement

R2 requires subscription checkout and bills overages. Allowances apply across the account, not per bucket. Inventory other usage before launch. Use Standard only, not Infrequent Access or optional paid products.

1. Keep R2 private: no public custom domain or r2.dev. Route application uploads, previews and build reads through authenticated, bounded APIs. Do not distribute S3 credentials to browsers/builds.
2. Starting limits: 500 compressed source photos, 2 MB/file, and 2 GB tracked storage including drafts, temporary objects and reservations. Keep full-resolution originals offline. Enforce byte/type/dimension limits server-side.
3. Reserve storage and operation budgets atomically in D1 before each R2 call. Concurrent requests must not independently pass the same quota check. Fail closed if counters cannot be checked. Include retries, metadata calls and lists; avoid multipart for small files. Preserve uncertain reservations after timeouts until reconciled.
4. Proposed monthly project ceilings: 100,000 Class A and 1 million Class B operations, well below provider allowances. Align resets to the provider accounting window. Warn at 50% and 75% of these internal ceilings; stop new media jobs at the ceiling.
5. Reconcile byte inventory on a bounded schedule and check account-wide usage independently. Other projects and dashboard operations bypass application counters and must be included when assessing headroom.
6. On Publish, download only approved images from the immutable snapshot, generate a fixed set of sizes during the build, and package them with static HTML. Keep output within Pages file/size limits. Never add a live R2 fallback when publishing fails.
7. Coalesce publishing; start with 100 content publishes/month, reserving the rest of the Pages allowance for code changes, previews and retries. Example: 100 full builds reading 500 photos each produce about 50,000 GETs before other operations.
8. Provide a media-processing pause switch. On quota exhaustion, retain the last successful static website and explain why uploads/publication are paused. Do not automatically delete business originals to reduce costs.

These are application safeguards, not a Cloudflare billing cap. Other account usage, privileged credentials, bugs, provider changes and stored data can still create charges. Budget alerts only notify; they do not stop usage. If an absolute inability to incur non-domain charges is required, use repository/static assets without R2.

## Publication and operational tradeoffs

Admin features remain: services/prices, media, offers, batches, leads and requests. Save drafts, then Publish. Expect a few minutes for rebuilding, subject to queue/limits, replacing the earlier 60-second freshness target. Track pending/failed revisions separately from the successful live version.

Public HTML/photos bypass Functions. If API quotas are exhausted, static browsing remains and forms show an error with phone/WhatsApp alternatives. Never show success for an unsaved enquiry. The lead inbox remains the source of truth if email quota is exhausted; retry notifications within quota or follow up manually.

Use protected existing local storage for independent exports and retain original media offline. Daily automation requires an available free runner/device; document the actual backup cadence and test restoration instead of silently adding paid storage.

## Deferred costs and growth

Gateway payments and automated WhatsApp messaging remain later phases: transactions/messages can be chargeable even without setup fees. Initially collect enquiries and agree service/payment arrangements manually. External payment methods are not assumed universally fee-free.

Measure traffic, enquiries, builds, database work and account-level R2 usage. Optimize or pause constrained features before exceeding application limits. Upgrade only after a later owner decision; SOLID adapters preserve the ability to change infrastructure.

## Official sources checked

- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/r2/buckets/public-buckets/
- https://developers.cloudflare.com/billing/manage/budget-alerts/
- https://www.cloudflare.com/plans/zero-trust-services/
- https://developers.cloudflare.com/turnstile/plans/
- https://resend.com/pricing
- https://razorpay.com/pricing/
- https://business.whatsapp.com/products/platform-pricing
