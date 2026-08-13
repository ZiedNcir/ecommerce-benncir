# Production Baseline Design

## Goal

Harden the existing BÊN NCÎR single-store e-commerce MVP so it has a safe production baseline without expanding product scope or introducing a new payment or infrastructure platform.

## Scope

This baseline covers:

- security and configuration defaults;
- request validation and safe query handling;
- reversible catalog administration;
- order and stock data integrity;
- missing application wiring and documentation consistency;
- automated verification for critical backend behavior.

This baseline does not add online payments, multi-store support, advanced permissions, token-storage redesign, CI/CD infrastructure, monitoring providers, or backup infrastructure.

## Design

### Security and configuration

Production startup must reject missing or unsafe configuration. `CLIENT_URL` is required for production CORS behavior, and placeholder JWT secrets or default admin credentials must not be accepted for production execution. Seed scripts may retain local-development defaults only when they are clearly development-only and never used by the server runtime.

Public write endpoints remain available for checkout and contact forms, but their payloads are validated before database or stock operations. Search values are treated as literal text rather than raw MongoDB regular expressions. Email templates escape user-controlled values before interpolation.

### Catalog lifecycle

Products and categories are deactivated rather than permanently deleted through normal admin actions. Public queries continue to exclude inactive records. Product/category relationships are preserved where possible so historical orders and reports remain understandable. Category deletion must not leave invalid parent or product references.

### Orders and stock

The backend remains authoritative for prices, totals, delivery fees, and stock. Existing rollback behavior is preserved and covered by tests. Cancellation and deletion behavior must avoid restoring stock more than once. Order history remains queryable after catalog deactivation.

### Application correctness

The existing account page is wired into the client router. ESLint configuration is aligned with the TypeScript source tree. README and deployment documentation describe the current `.ts`/`.tsx` layout and actual commands. Demo fallback remains explicitly opt-in and is not used when production mode is configured.

### Testing strategy

The backend receives a test script and focused tests for:

- configuration/security guards;
- authentication and admin-only access decisions;
- literal search handling;
- soft deletion of products and categories;
- checkout total calculation and stock restoration;
- the existing INGCO scraper behavior.

Tests should prefer pure helpers for deterministic behavior and use an isolated database setup only where controller behavior cannot be tested otherwise.

## Acceptance criteria

- Frontend and backend type checks pass.
- Frontend production build passes.
- Lint checks TypeScript and TSX files and reports no new errors.
- Backend test command runs successfully and covers the critical behaviors above.
- Production startup rejects missing `MONGO_URI`, `JWT_SECRET`, or `CLIENT_URL`, and rejects placeholder JWT secrets.
- Normal admin deletion deactivates products/categories and public endpoints exclude them.
- `/account` is reachable from the client router.
- Documentation no longer refers to obsolete JavaScript source paths.

## Out of scope

- payment gateway integration;
- multi-store or multi-tenant architecture;
- secure-cookie authentication migration;
- deployment provider setup;
- external observability, backups, and CI/CD.
