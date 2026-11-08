# AGENTS.md

## Project guidance

- Keep application code in `frontend/` and `backend/`.
- Keep deployment and environment configuration in `infrastructure/`.
- Add automated checks under `tests/` and reusable utilities under `scripts/`.
- Update the relevant documentation when architecture, APIs, security, or deployment behavior changes.

## Working agreements

- Prefer small, focused changes.
- Do not commit secrets or local environment files.
- Run the applicable tests and checks before opening a pull request.

## Engineering standards

- Launch spending target is domain-only. Use free plans; the owner selected R2 Standard within its free allowance, requiring conservative limits because it has metered overages. Do not activate other paid subscriptions without a later owner decision. Public pages/photos are static with rebuild-on-publish; consult ARCHITECTURE.md and docs/deployment/BUDGET.md.

- Follow `docs/architecture/ENGINEERING_STANDARDS.md` for SOLID, dependency boundaries, testing and review expectations.
- Organize a modular monolith by business feature; deploy one application initially.
- Keep business rules independent of Astro, HTTP, Cloudflare bindings and external provider SDKs.
- Use small TypeScript interfaces at external boundaries and explicit dependency injection through functions or constructors.
- Prefer composition and simple functions; do not introduce class hierarchies, generic repositories or a dependency injection framework without a concrete need.
- Validate external inputs at runtime; enforce authorization and business invariants on the server.
- Keep changes proportional to the current phase. Do not implement speculative payment or WhatsApp integrations before their phase.

