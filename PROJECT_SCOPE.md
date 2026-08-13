# Project Scope — Single Store MVP

## Current decision

The project is locked for the moment as one single e-commerce website: **BÊN NCÎR Commerce**.

No multi-store, no multi-brand, no dynamic tenant system, and no `/alma` or `/ben-ncir` routing will be added in this version.

The objective is to finish one complete professional website first, then upgrade the architecture later if needed.

## Included in this version

### Client website

- Home page
- About page
- Contact page
- Product listing
- Product details
- Backend-driven product filters
- Categories
- Favorites
- Cart
- Checkout without online payment
- Responsive header and footer

### Admin dashboard

- Admin login
- First admin setup
- Create admin account
- Dashboard overview
- Product management
- Add/edit/delete product
- Category management
- Order management
- User management

### Backend

- Node.js / Express API
- MongoDB / Mongoose
- JWT authentication
- Admin role protection
- Products API
- Categories API
- Orders API
- Users API
- Favorites/cart frontend state connected to backend products

## Not included yet

These features are intentionally postponed:

- Multi-store / multi-brand architecture
- Multiple websites from the same backend
- Domain mapping
- Store selector in dashboard
- Theme builder per brand
- Online payment integration
- Advanced role permissions
- Email/SMS notifications
- ERP/accounting integration

## Next priority

Finish the single-store project at production quality before opening future features.
