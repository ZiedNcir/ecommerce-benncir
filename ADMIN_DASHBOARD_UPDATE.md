# Admin dashboard update

This version adds:

- Product hard deletion from admin and API.
- Category hard deletion from admin and API.
  - If a category is linked to products, the API blocks deletion unless `force=true` is sent.
  - With `force=true`, the category is deleted and detached from linked products.
- Order deletion from admin and API.
- Dashboard analytics API: `/api/orders/analytics/dashboard`.
- Dashboard cards and charts for orders, revenue, average order, users, low stock, recent orders and order status.
