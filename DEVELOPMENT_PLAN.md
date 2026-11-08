# Development plan

Status: local MVP implemented and verified on 8 November 2026. No cloud resources or production deployment have been created.

## Implementation checkpoint

- Completed: responsive public pages, service routes, SEO metadata and launch indexing gate; owner-provided branding; transparent web monogram; clearly labelled illustrative photos.
- Completed locally: persistent enquiries, consent and validation, a dismissible enquiry popup, admin inbox/status changes, service/price/course/offer/testimonial/video draft editing, version conflict protection, private media endpoints and conservative atomic R2 budget reservations. Video entries use approved third-party embeds to preserve the domain-only infrastructure budget.
- Implemented but awaiting live configuration: Access JWT authentication, Turnstile, build-token-protected publication snapshots, deploy hook and media synchronization into static output.
- Verified: strict frontend/backend type checks, 8 domain/security tests, 19 local integration checks, desktop and 390px mobile inspection, browser enquiry submission visible in the admin inbox.
- Remaining for launch: final prices, courses, opening hours and original portfolio, domain/Cloudflare resources and secrets, production end-to-end tests, staged capacity measurements, backup/restore and quota monitoring. The owner confirmed the street address and phone; example prices are labelled samples. Email notifications and automated deployment-status reconciliation are not yet implemented.

The phases below remain the delivery roadmap; an implementation entry above does not imply production acceptance.

## Phase 0: Architecture and content definition

- Record confirmed location, INR, booking workflow and hosting budget. Completed.
- Propose stack, data flow, SEO strategy, operating costs and staged delivery. Completed as proposal.
- Establish SOLID and related engineering rules in `docs/architecture/ENGINEERING_STANDARDS.md`. Completed.
- Revised the proposal for the owner's domain-only launch budget: static Pages, free API/database/media services and rebuild-on-publish. Supersedes paid Workers fallback and 60-second content freshness.
- Gather brand/domain, exact address, languages, services/prices, academy courses and original photos.
- Resolve brand, language, starter content and visual direction before customer-facing implementation; prepare mobile and desktop page designs. Final launch assets and later payment policies need not block the technical foundation.

## Phase 1: Public site and admin MVP

- Verify Astro static output, Pages Functions/D1 and admin authentication within the free CPU budget. Optimize failing paths; do not enable a paid plan automatically.
- Build six public pages, service detail routes where useful, policy pages, local metadata and sitemap.
- Add original responsive images, two conversion paths, inline forms and optional dismissible offers.
- Build Access-protected admin for media, prices, offers, batches, leads and booking requests.
- Implement schema/migrations, indexed queries, immutable public snapshots, authenticated build retrieval and coalesced rebuild-on-publish with deployment status.
- Keep R2 Standard private as requested; copy published photos into Pages output. Implement bounded uploads, atomic budget reservations and fail-closed limits before enabling uploads.
- Add Turnstile, form validation, contact-use disclosure, optional marketing consent and durable email notifications.
- Keep customer accounts and payment collection out of this first release.

Exit: public browsing and enquiry-to-admin follow-up work end to end; no real lead is accepted without persistence.

## Phase 2: Deploy and validate

- Configure domain, DNS, HTTPS, separate staging/production and scoped secrets.
- Run mobile/accessibility checks, HTML/SEO checks, form-abuse and admin access tests.
- Run the 100-visitor load profile and enquiry burst described in ARCHITECTURE.md; capture usage and latency.
- Configure errors/quota alerts, protected exports to existing storage, restore procedure and deployment rollback; document backup cadence and available free runner/device.
- Verify free plans for Pages/Workers/D1/email, R2 Standard with conservative application limits, paid add-ons disabled and clear quota failure behavior. R2 is metered, not a hard-capped free plan. No paid upgrade without a later owner decision.
- Launch, configure Search Console and the actual business profile, then measure real traffic and conversions.

Exit: tested capacity and recovery, verified contact details, owner-ready administration guide and live website.

## Phase 3: Booking deposits and payments

Deferred beyond the domain-only launch. Gateway transaction charges require a revised operating budget even if integration has no setup subscription.

- Finalize artist capacity, service duration/buffers, deposit, quote expiry, cancellation and refund rules.
- Complete gateway onboarding and policies; test server-created orders and hosted checkout.
- Implement atomic capacity holds, signed customer links, verified/idempotent webhooks, reconciliation and refund states.
- Test concurrent approvals, late payments, webhook replays, amount tampering and provider outages.
- Tighten recovery objectives; notify customers only after a verified state transition.

Exit: payment and booking records reconcile with the provider and cannot double-confirm capacity.

## Phase 4: WhatsApp and optional expansion

Automated messaging is deferred beyond the domain-only launch; click-to-chat and manual follow-up remain the starting workflow.

- Begin with a click-to-chat link and manual responses; later integrate the official Business Platform.
- Add consent-aware booking notifications and separately opted-in promotional templates, opt-out handling and retries.
- Estimate message costs before activation; keep notifications independent of booking persistence.
- Add customer accounts, self-service slots, student portal or multi-branch features only when the business needs them.

## Proposed repository responsibilities

- frontend/: Astro pages/layouts, content, styling and admin UI.
- backend/: business rules, validation, database repositories, integrations and migration definitions; imported by server routes initially.
- infrastructure/: deployment configuration and environment documentation.
- tests/: focused integration, booking/payment correctness, access and load checks.
- scripts/: media preparation, exports, restore and release helpers.
- .github/workflows/: CI and controlled deployment when implementation starts.

No delivery dates are committed until content readiness and implementation scope are agreed.

