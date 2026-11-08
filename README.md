# SandhyaVermaMakeovers

A black-and-gold website for the celebrity makeup studio and academy in Janakpuri, West Delhi, India. Astro generates static public pages; Cloudflare Pages Functions, D1 and private R2 support enquiries and administration.

Current status: working local MVP for `sandhyavermamakeovers.online`, including the owner's wall logo, contact details, opening hours, service prices, preview portfolio, a consent-aware enquiry popup, enquiry persistence and admin content/media tools. Cloudflare provisioning and production deployment have not been performed. The domain is registered with Hostinger and awaits Cloudflare activation. Preview pages are not indexable until launch is enabled.

## Run locally

On this Windows machine, dependencies and the build are already prepared. If PowerShell cannot find `pnpm`, run `.\preview.cmd` from the project folder. The launcher uses Node from PATH or the existing Codex runtime, starts the full local preview, and makes no persistent PATH changes. Keep that terminal open; Ctrl+C stops the server. It serves the latest build, so source edits still require rebuilding.

Use Node 24 and pnpm 11. Run `pnpm install`, copy `infrastructure/dev.vars.example` to `.dev.vars`, then run:

```sh
pnpm db:local
pnpm build
pnpm preview
```

Open http://127.0.0.1:4321/ and http://127.0.0.1:4321/admin/. Local admin access works only with the explicit local flags and a loopback hostname. No cloud account is used by this preview.

`pnpm verify` runs type checks, domain tests and the static build. With the preview running, `pnpm test:integration` checks the API and persists a labelled synthetic enquiry. See [verification results](docs/QA.md) and [setup and production requirements](docs/deployment/SETUP.md).

Admin edits save a draft. Production publication requires the documented authenticated build export and Cloudflare deploy hook; saving a draft does not immediately change static pages. Payments and automated WhatsApp are deferred.

For the exact domain activation and deployment sequence, use [the domain launch checklist](docs/deployment/DOMAIN_LAUNCH.md).

Start with [Architecture](ARCHITECTURE.md), [Development plan](DEVELOPMENT_PLAN.md), [Goals](GOALS.md), and [Hosting budget](docs/deployment/BUDGET.md).

## Repository layout

- `frontend/` — static pages, layouts, browser scripts and API entry point
- `backend/` — business validation, application services, Cloudflare adapters and migrations
- `infrastructure/` — infrastructure and deployment configuration
- `docs/` — architecture, decisions, API, database, security, and deployment documentation
- `tests/` — automated tests
- `scripts/` — development and maintenance scripts
- `.github/workflows/` — verification workflow
- `functions/` and `wrangler.toml` — root entries required by the Cloudflare Pages toolchain

See `GOALS.md`, `ARCHITECTURE.md`, and `DEVELOPMENT_PLAN.md` for project direction.

