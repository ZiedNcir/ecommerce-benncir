# Admin UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give every admin screen a coherent, polished, responsive commerce-dashboard experience while preserving existing APIs and workflows.

**Architecture:** Extend the existing `AdminLayout`, `AdminDashboard`, admin pages, and shared stylesheet rather than introducing a new component framework. Use shared CSS primitives for shell, headers, cards, tables, forms, badges, alerts, loading, and responsive layouts, then add focused JSX improvements where the current markup needs stronger hierarchy or actions.

**Tech Stack:** React, TypeScript, React Router, Lucide icons, existing CSS.

## Global Constraints

- Preserve existing API contracts and admin routes.
- Do not change backend behavior or data models for this visual task.
- Keep all user-facing admin copy in French, matching the current product.
- Maintain responsive behavior for desktop, tablet, and mobile.
- Run frontend typecheck and production build after each major phase.

---

### Task 1: Establish the shared admin visual system

**Files:**
- Modify: `frontend/src/layouts/AdminLayout.tsx`
- Modify: `frontend/src/styles.css`

- [ ] Add a branded shell header, mobile navigation affordance, sidebar section labels, and a compact admin profile block.
- [ ] Add reusable CSS primitives for page headers, toolbar actions, metric cards, panels, status pills, alerts, tables, forms, modal overlays, and responsive breakpoints.
- [ ] Verify existing admin routes still render with `npm run typecheck` and `npm run build`.

### Task 2: Redesign dashboard and navigation hierarchy

**Files:**
- Modify: `frontend/src/pages/admin/AdminDashboard.tsx`
- Modify: `frontend/src/layouts/AdminLayout.tsx`
- Modify: `frontend/src/styles.css`

- [ ] Add greeting/date context, refresh and quick-action controls.
- [ ] Enhance KPI cards with icons, labels, supporting values, and visual accents.
- [ ] Add operational alerts for low stock, pending orders, unread messages, and inactive products using existing analytics data.
- [ ] Improve revenue chart, recent orders, category performance, and status sections with clearer visual hierarchy.
- [ ] Verify dashboard data remains sourced from the existing APIs.

### Task 3: Improve catalog management screens

**Files:**
- Modify: `frontend/src/pages/admin/AdminProducts.tsx`
- Modify: `frontend/src/pages/admin/AdminProductForm.tsx`
- Modify: `frontend/src/pages/admin/AdminCategories.tsx`
- Modify: `frontend/src/styles.css`

- [ ] Improve product and category page headers, metrics, filters, table density, and action controls.
- [ ] Add clearer active/inactive/publication/stock visual states.
- [ ] Improve product wizard section navigation, preview hierarchy, and save actions.
- [ ] Improve category tree readability and deactivation warning presentation.
- [ ] Verify product/category create, update, and deactivate actions remain unchanged.

### Task 4: Improve order, message, and user administration screens

**Files:**
- Modify: `frontend/src/pages/admin/AdminOrders.tsx`
- Modify: `frontend/src/pages/admin/AdminOrderDetails.tsx`
- Modify: `frontend/src/pages/admin/AdminMessages.tsx`
- Modify: `frontend/src/pages/admin/AdminUsers.tsx`
- Modify: `frontend/src/pages/admin/AdminCreateAdmin.tsx`
- Modify: `frontend/src/styles.css`

- [ ] Improve order filters, summary metrics, status workflow, and table readability.
- [ ] Improve order detail panels, timeline, totals, and customer/delivery summaries.
- [ ] Improve messages inbox, unread states, modal detail view, and action affordances.
- [ ] Improve users table, role controls, and create-admin form guidance.
- [ ] Verify all existing API actions and admin routes remain available.

### Task 5: Polish authentication, loading, empty, and responsive states

**Files:**
- Modify: `frontend/src/pages/admin/AdminLogin.tsx`
- Modify: `frontend/src/pages/admin/AdminSetup.tsx`
- Modify: `frontend/src/components/Loading.tsx`
- Modify: `frontend/src/components/EmptyState.tsx`
- Modify: `frontend/src/styles.css`

- [ ] Apply the admin brand treatment to login and first-admin setup.
- [ ] Standardize loading skeletons, empty states, errors, and success feedback.
- [ ] Verify keyboard focus, readable contrast, mobile layout, and no horizontal overflow.

### Task 6: Final verification

- [ ] Run `cd frontend && npm run typecheck`.
- [ ] Run `cd frontend && npm run build`.
- [ ] Run root `npm run lint` and confirm no lint errors.
- [ ] Review changed files and confirm no backend/API behavior changed.
