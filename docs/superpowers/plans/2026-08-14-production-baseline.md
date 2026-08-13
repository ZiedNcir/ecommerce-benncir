# Production Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing BÊN NCÎR single-store e-commerce MVP for production use without expanding its business scope.

**Architecture:** Keep the current React/Vite and Express/Mongoose boundaries. Add small backend utility modules for configuration, validation, escaping, and catalog lifecycle behavior; keep controllers responsible for orchestration. Preserve the existing JWT flow and backend-authoritative order calculations while making destructive admin actions reversible.

**Tech Stack:** TypeScript, React, Vite, Express, Mongoose, JWT, Node test runner, ESLint.

## Global Constraints

- Do not add online payments, multi-store behavior, secure-cookie authentication, CI/CD providers, monitoring providers, or backup infrastructure.
- Do not expose raw MongoDB regular expressions from user-controlled search input.
- Normal admin deletion must deactivate records rather than permanently remove catalog data.
- Backend remains authoritative for product prices, order totals, delivery fees, and stock.
- Use test-first changes for production behavior: write a failing test, run it, implement the smallest fix, then rerun the test.
- Do not commit because this workspace is not currently a Git repository.

---

### Task 1: Add backend test infrastructure and pure security helpers

**Files:**
- Create: `backend/src/utils/security.ts`
- Create: `backend/src/utils/security.test.ts`
- Create: `backend/src/config/runtime.ts`
- Create: `backend/src/config/runtime.test.ts`
- Modify: `backend/package.json`
- Modify: `backend/src/server.ts`

**Interfaces:**
- `escapeRegex(value: string): string` returns a literal-safe regex pattern.
- `assertRuntimeConfig(env: NodeJS.ProcessEnv): { mongoUri: string; jwtSecret: string; clientUrl: string }` throws a descriptive configuration error for missing or unsafe production settings.
- `isProduction(env: NodeJS.ProcessEnv): boolean` identifies production mode.

- [ ] **Step 1: Add the test command and failing security tests.**

Add a backend script:

```json
"test": "node --import tsx --test src/**/*.test.ts"
```

Add tests proving that regex metacharacters are escaped and production configuration rejects missing `CLIENT_URL` and placeholder JWT secrets.

- [ ] **Step 2: Run the focused tests and verify they fail for missing exports.**

Run:

```bash
npm test -- --test-name-pattern="escapeRegex|production configuration"
```

Expected: test failures because `security.ts` and `runtime.ts` do not yet provide the required functions.

- [ ] **Step 3: Implement the minimal helpers.**

Use a standard literal-regex escape implementation and reject production values that are empty, shorter than 32 characters, or equal to known development defaults such as `replace-with-a-long-random-secret` and `dev_secret`.

- [ ] **Step 4: Wire runtime validation into server startup.**

Load configuration once after `dotenv.config()`. Require `MONGO_URI` and `JWT_SECRET` in all environments; require a non-empty `CLIENT_URL` in production. Pass the resolved values to database connection and JWT generation/verification where practical.

- [ ] **Step 5: Run the focused tests and typecheck.**

Run:

```bash
npm test -- --test-name-pattern="escapeRegex|production configuration"
npm run typecheck
```

Expected: all focused tests pass and TypeScript exits with code 0.

### Task 2: Validate public and administrative request payloads

**Files:**
- Create: `backend/src/utils/validation.ts`
- Create: `backend/src/utils/validation.test.ts`
- Modify: `backend/src/controllers/auth.controller.ts`
- Modify: `backend/src/controllers/contact.controller.ts`
- Modify: `backend/src/controllers/order.controller.ts`
- Modify: `backend/src/controllers/product.controller.ts`
- Modify: `backend/src/controllers/category.controller.ts`
- Modify: `backend/src/controllers/user.controller.ts`

**Interfaces:**
- `requireText(value: unknown, field: string, options?: { min?: number; max?: number }): string` returns trimmed text or throws a 400 error.
- `requireEmail(value: unknown, field?: string): string` returns normalized email or throws a 400 error.
- `requirePositiveInteger(value: unknown, field: string): number` returns a positive integer or throws a 400 error.

- [ ] **Step 1: Write failing validation tests.**

Cover blank names, malformed emails, short passwords, non-positive quantities, and overlong contact messages. Assert status code 400 and field-specific messages.

- [ ] **Step 2: Run validation tests and confirm failure.**

Run:

```bash
npm test -- --test-name-pattern="validation"
```

Expected: failures because validation helpers do not exist.

- [ ] **Step 3: Implement validation helpers and use them at controller boundaries.**

Validate before queries, stock updates, or model creation. Use bounded lengths for customer fields, product names/descriptions, category fields, user fields, and contact messages. Validate order quantities before product hydration.

- [ ] **Step 4: Run tests and backend typecheck.**

Run:

```bash
npm test
npm run typecheck
```

Expected: all backend tests pass and typecheck remains clean.

### Task 3: Make catalog deletion reversible and safe

**Files:**
- Create: `backend/src/utils/catalogLifecycle.ts`
- Create: `backend/src/utils/catalogLifecycle.test.ts`
- Modify: `backend/src/controllers/product.controller.ts`
- Modify: `backend/src/controllers/category.controller.ts`
- Modify: `backend/src/routes/product.routes.ts`
- Modify: `backend/src/routes/category.routes.ts`

**Interfaces:**
- `deactivateProduct(id: string): Promise<{ _id: string; isActive: boolean }>` marks a product inactive and hidden from public queries.
- `deactivateCategory(id: string, force: boolean): Promise<{ _id: string; isActive: boolean }>` marks a category inactive, detaches child parent links when forced, and removes the category from active product relationships without deleting the category document.

- [ ] **Step 1: Write failing lifecycle tests.**

Test that product deletion updates `isActive`, `visibleOnSite`, and `visibleInSearch`; category deletion rejects linked products without `force=true`; forced deletion deactivates the category and detaches active product references without deleting the category document.

- [ ] **Step 2: Run lifecycle tests and verify failure.**

Run:

```bash
npm test -- --test-name-pattern="catalog lifecycle"
```

Expected: failures because deletion still calls `findByIdAndDelete`.

- [ ] **Step 3: Implement lifecycle helpers and controller integration.**

Replace normal product deletion with an update. Replace category deletion with an update and relationship cleanup. Preserve existing API response shape where possible, adding `deactivated: true` if needed.

- [ ] **Step 4: Verify public filtering.**

Ensure product and category public queries continue to require active/visible records. Add a focused test for inactive products/categories being excluded.

- [ ] **Step 5: Run lifecycle tests and typecheck.**

Run:

```bash
npm test -- --test-name-pattern="catalog lifecycle"
npm run typecheck
```

### Task 4: Harden order totals, stock restoration, and email rendering

**Files:**
- Create: `backend/src/utils/orderRules.ts`
- Create: `backend/src/utils/orderRules.test.ts`
- Create: `backend/src/utils/html.ts`
- Create: `backend/src/utils/html.test.ts`
- Modify: `backend/src/controllers/order.controller.ts`
- Modify: `backend/src/utils/mailer.ts`
- Modify: `backend/src/models/Order.ts`

**Interfaces:**
- `calculateOrderTotals(items: Array<{ price: number; quantity: number }>, deliveryFee: number): { subtotal: number; total: number }` calculates totals from server-trusted values.
- `escapeHtml(value: unknown): string` escapes text for HTML output.
- `canRestoreStock(order: { stockRestored?: boolean }): boolean` returns false after stock has already been restored.

- [ ] **Step 1: Write failing order-rule and HTML escaping tests.**

Cover correct subtotal/total calculation, rejection of invalid quantities, idempotent stock restoration decisions, and escaping of `<`, `>`, `&`, quotes, and apostrophes.

- [ ] **Step 2: Run tests and verify they fail.**

Run:

```bash
npm test -- --test-name-pattern="order totals|stock restoration|HTML escaping"
```

- [ ] **Step 3: Implement the pure helpers.**

Keep delivery fee fixed at the existing 7 DT business rule. Reject invalid item values rather than coercing them into a valid order.

- [ ] **Step 4: Integrate helpers into order creation, cancellation, deletion, and email rendering.**

Use the helper for totals, guard restoration with `stockRestored`, and escape every customer/product value inserted into the email template.

- [ ] **Step 5: Run all backend tests and typecheck.**

Run:

```bash
npm test
npm run typecheck
```

### Task 5: Align frontend routing, API fallback, and linting

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/services/auth.ts`
- Modify: `eslint.config.js`
- Modify: `frontend/package.json`

**Interfaces:**
- `/account` renders `Account.tsx` within `ClientLayout`.
- Demo fallback is active only when `VITE_ENABLE_DEMO=true` and never silently enabled by an API failure in production configuration.

- [ ] **Step 1: Define the route regression check.**

Do not add a new frontend test framework for this one wiring change. The regression check is an explicit source assertion after implementation: `rg -n 'path="/account"|Account' frontend/src/App.tsx`, followed by the frontend typecheck and production build in Step 4.

- [ ] **Step 2: Add the account route and explicit fallback guard.**

Import `Account` and register `/account`. Keep API errors visible when demo mode is false.

- [ ] **Step 3: Update ESLint globs and TypeScript-aware configuration.**

Make lint include `frontend/src/**/*.{ts,tsx}` and `backend/src/**/*.ts`. Avoid claiming TypeScript lint coverage until the configuration actually parses those files.

- [ ] **Step 4: Run frontend checks.**

Run:

```bash
npm run typecheck
npm run build
cd ..
npm run lint
```

Expected: build and typecheck pass; lint reports no errors. Existing warnings must be reviewed and either fixed or explicitly documented.

### Task 6: Update environment safety and documentation

**Files:**
- Modify: `.env.deploy.example`
- Modify: `README.md`
- Modify: `DEPLOYMENT.md`
- Modify: `TYPESCRIPT_MIGRATION.md`
- Create: `backend/.env.example` if absent
- Create: `frontend/.env.example` if absent

- [ ] **Step 1: Add safe environment examples.**

Use explicit placeholders such as `generate-a-random-secret-of-at-least-32-characters`; do not include a working default admin password. Document that production startup rejects placeholder secrets.

- [ ] **Step 2: Correct obsolete source references.**

Replace references to `api.js` and `mockData.js` with `.ts` equivalents and document the actual root/frontend/backend commands.

- [ ] **Step 3: Document reversible deletion and production checks.**

Explain that admin deletion deactivates catalog records, and list the required environment variables and verification commands.

- [ ] **Step 4: Run documentation/configuration checks.**

Run:

```bash
rg -n "api\\.js|mockData\\.js|replace-with-a-long-random-secret" README.md DEPLOYMENT.md TYPESCRIPT_MIGRATION.md .env.deploy.example backend/.env.example frontend/.env.example
```

Expected: no obsolete source references and no working production credentials.

### Task 7: Full verification and handoff

**Files:**
- Modify: any files required to resolve verification failures from Tasks 1–6

- [ ] **Step 1: Run backend verification.**

```bash
cd backend
npm test
npm run typecheck
```

- [ ] **Step 2: Run frontend verification.**

```bash
cd frontend
npm run typecheck
npm run build
```

- [ ] **Step 3: Run repository lint verification.**

```bash
cd ..
npm run lint
```

- [ ] **Step 4: Review the final changed-file list and production checklist.**

Confirm that no credentials, destructive commands, unrelated feature work, or undocumented behavior changes were introduced. Since the workspace is not a Git repository, use the changed-file list and targeted file inspection rather than a Git diff.

- [ ] **Step 5: Report evidence and remaining limitations.**

Report exact commands run, their exit status, and any limitations such as unavailable MongoDB integration testing or unresolved non-blocking lint warnings.
