# Engineering standards

Established 7 November 2026 following the owner's request to follow SOLID and related design principles. These are implementation requirements, not a claim that application code already exists.

## Architecture and dependency direction

Use a modular monolith: one deployable application with explicit feature boundaries for services, academy, media, offers, enquiries and later bookings/payments. Add layers only where the feature needs them.

Dependency direction:

`UI / HTTP routes -> application use cases -> domain rules and narrow ports`

Infrastructure adapters implement those ports. A small composition root connects the use cases to D1, private R2 and external services. Domain and application code must not import framework request objects, Cloudflare bindings or provider SDKs. Server routes own HTTP parsing, authentication context and response mapping; business decisions belong in use cases/domain functions.

Proposed locations once coding starts:

- `frontend/src/pages/`: statically generated public pages and admin shell.
- `frontend/functions/api/`: thin Pages Functions API entry points importing backend use cases.
- `frontend/src/components/`: reusable presentation and feature UI.
- `backend/src/modules/<feature>/`: feature rules, use cases and required port types.
- `backend/src/adapters/`: D1 repositories, media, publication and notification/payment adapters as needed.
- `backend/src/composition/`: server-only dependency wiring.

Database migrations and provider credentials remain server-side. Never import server modules through browser component barrels. Cross-feature interaction uses explicit use cases/contracts rather than reaching into another feature's tables from arbitrary handlers.

## SOLID in practice

| Principle | Project rule | Example |
| --- | --- | --- |
| Single responsibility | Separate presentation, orchestration, business rules and I/O | An enquiry handler parses HTTP; a use case saves the enquiry and notification job; an adapter sends email |
| Open/closed | Extend at actual variation points with adapters or strategies | A future WhatsApp sender implements a notification contract without rewriting enquiry capture |
| Liskov substitution | Implementations honor the same behavioral contract, including errors and guarantees | A fake and D1 repository agree on duplicate handling and not-found behavior |
| Interface segregation | Consumers depend on only the capabilities they need | Public service reads do not require admin write methods |
| Dependency inversion | Business logic depends on narrow contracts; composition supplies implementations | Quote logic accepts repositories and a clock instead of reading global bindings |

SOLID applies to modules and functions as well as classes. Use plain functions and objects where they communicate intent clearly. Introduce an abstraction for a real boundary or variation, not for every helper. Avoid an inheritance hierarchy for services or a universal CRUD repository.

## Related design strategies

- **KISS and YAGNI:** use the simplest design that satisfies the current phase. Keep customer accounts, queues as separate infrastructure, microservices and elaborate plugin systems out until a measured need exists.
- **DRY:** share stable repeated rules such as money validation and consent handling. Similar-looking code with different business meanings need not share an abstraction.
- **Composition over inheritance:** assemble behavior from small dependencies; inject clocks, ID generators and provider clients where deterministic behavior matters.
- **Explicit contracts:** strict TypeScript, runtime input validation, bounded pagination, structured errors and clear state transitions. Avoid unchecked casts and broad `any` types.
- **Functional core:** keep pricing, offer eligibility and state-transition decisions deterministic. Isolate network calls, storage and time-dependent inputs.
- **Transaction boundaries:** repositories expose business operations with the required atomicity, not only CRUD methods. Booking reservations and notification-outbox creation must preserve invariants under concurrency.
- **Idempotency:** retryable mutations and provider events must not create duplicate bookings, payments or business transitions. Define idempotency-key scope and conflict behavior.
- **Accessible design system:** share color/spacing/type tokens and reusable form/dialog/button behavior; keep semantic HTML, focus handling and mobile layouts consistent.
- **Security by default:** enforce server-side authorization, validate uploads, parameterize queries, protect mutations and prevent personal-data logging. Public DTOs expose only intended fields.
- **Operational clarity:** structured logs with request IDs, actionable errors and measured latency/CPU/database usage. Background notifications must be durable and retryable.

## Testing and review

Test meaningful behavior and risks rather than private implementation details or trivial wrappers:

- Unit tests for pricing, offer windows, consent rules and valid/invalid state transitions.
- Contract/integration tests for adapters, migrations, authorization, atomic writes and unique constraints; mocks alone cannot establish database correctness.
- End-to-end tests for public enquiry submission, admin follow-up and publication.
- In the payment phase, concurrency tests for capacity conflicts plus webhook replay, late-payment and reconciliation tests.
- Mobile, keyboard and SEO checks; load tests for the agreed 100-visitor workload before launch.

CI should run formatting/lint checks, TypeScript checks, relevant tests and the production build. Establish import restrictions when source modules exist. Do not add a coverage percentage target in place of testing the important failure cases.

Review each feature for clear ownership, correct dependency direction, input/permission checks, bounded queries, appropriate caching, useful tests and operational failure handling. Record substantial architecture changes in `docs/decisions/` with context, decision, alternatives and consequences.

## Readiness before coding

Technical defaults are the proposed Astro/TypeScript/Cloudflare stack, one deployment, guest enquiries, admin-confirmed availability and phased payment delivery. The owner has confirmed India/INR, Janakpuri/West Delhi and the hosting budget.

Ask for brand name, English/bilingual preference, a starter list of services/courses and the desired visual direction before building customer-facing screens. Temporary explicitly labelled content can support a foundation prototype; never publish invented prices, certifications or testimonials.

Exact address, contact details, final prices, original photos, domain and staff login identities are required for launch but need not block a technical foundation. Artist capacity, deposits, hold expiry, cancellation/refund terms and gateway onboarding are required before the payment phase, not before enquiry-only development.
