# Category Create and Update States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the admin category form visually and semantically distinguish creating a category from updating an existing category.

**Architecture:** Keep the existing `AdminCategories` state and API flow. Add mode-specific copy and CSS classes derived from `editing`, plus a visible selected-category context and explicit cancel action in update mode.

**Tech Stack:** React, TypeScript, existing admin CSS, existing categories API.

## Global Constraints

- Preserve the existing category fields and API endpoints.
- Keep create mode as the default state.
- Do not change MongoDB models or backend routes.

### Task 1: Add mode-specific category form context

**Files:**
- Modify: `frontend/src/pages/admin/AdminCategories.tsx`
- Modify: `frontend/src/styles.css`

- [x] Derive create/update labels and a mode class from `editing`.
- [x] Add update context showing the selected category name.
- [x] Use distinct headings, submit labels, and cancel copy.
- [x] Add mode-specific visual styling without changing form behavior.
- [x] Run frontend typecheck, production build, and `git diff --check`.
