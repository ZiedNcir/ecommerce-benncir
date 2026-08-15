# BÊN NCÎR Commerce - E-commerce MERN Starter

Starter complet inspiré des interfaces fournies : boutique e-commerce, catégories, liste produits, détail produit, panier, checkout et dashboard admin.


## Project scope

This version is locked as a **single-store e-commerce MVP** for **BÊN NCÎR Commerce**.

Multi-store features such as Alma, multi-brand routing, tenant management, and domain mapping are intentionally postponed. See `PROJECT_SCOPE.md`.

## Stack

- Frontend : React, Vite, React Router, Zustand, Axios, Lucide Icons
- Backend : Node.js, Express, MongoDB, Mongoose, JWT
- Paiement : paiement à la livraison prêt côté checkout

## Démarrage

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Routes frontend principales

- `/` accueil
- `/categories` toutes les catégories
- `/category/electronics` catégorie avec filtres
- `/product/watch` détail produit
- `/cart` panier
- `/checkout` caisse
- `/admin` dashboard admin
- `/admin/products` gestion produits

## API intégrée

Le frontend utilise `frontend/src/services/api.ts` pour appeler :

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/categories`
- `POST /api/orders`
- `GET /api/orders`
- `POST /api/auth/login`

Des données mockées sont incluses dans `frontend/src/assets/mockData.ts` pour afficher l’interface uniquement lorsque `VITE_ENABLE_DEMO=true` en développement.

## Product filtering update

The frontend product page now supports real header filtering:

- Header search submits to `/products?search=...`.
- Header category selector submits to `/products?category=...`.
- Product page reads URL parameters and filters products locally with mock fallback.
- API integration sends `search`, `category`, and `sort` query params to the backend.
- Backend product controller supports search, category slug/ObjectId, price range, featured, and sorting.

## ESLint formatting

Install root dev dependencies once:

```bash
npm install
```

Check code quality:

```bash
npm run lint
```

Auto-format and fix supported ESLint issues:

```bash
npm run format
```

VS Code is configured to apply ESLint fixes on save through `.vscode/settings.json`.

## Latest update: dashboard and backend-driven storefront

- Added admin interface to create another administrator account: `/admin/users/new-admin`.
- Added backend endpoints:
  - `POST /api/auth/admin` protected by admin role.
  - `POST /api/auth/setup-admin` for first admin bootstrap only when no admin exists.
- Product listing, header filter, product detail, favorites and cart now use backend-loaded product/category data.
- Added favorites page: `/favorites`.
- Removed hardcoded product recommendations from cart/product detail pages; related and suggested products are requested from `/api/products`.

## Update produit - vidéo démonstrative

Chaque produit peut maintenant recevoir une vidéo démonstrative depuis le dashboard admin.

Champs ajoutés côté produit :

- `demoVideo` : lien vidéo.
- `demoVideoType` : `url`, `youtube`, `vimeo` ou `upload`.
- `demoVideoTitle` : titre affiché sur la fiche produit.

La fiche produit affiche automatiquement la vidéo si le champ est renseigné. Les cartes produits affichent un badge `Vidéo` lorsqu'une vidéo existe.

## Backend admin CRUD update

Cette version ajoute une gestion backend complète depuis MongoDB local :

- `GET /api/categories?includeInactive=true` : liste catégories avec compteur produits.
- `POST /api/categories` : nouvelle catégorie.
- `PUT /api/categories/:id` : modification catégorie.
- `DELETE /api/categories/:id?force=true` : désactivation réversible de catégorie.
- `GET /api/products?includeInactive=true` : liste produits admin, actifs et inactifs.
- `POST /api/products` : insertion produit avec une ou plusieurs catégories.
- `PUT /api/products/:id` : modification produit.
- `DELETE /api/products/:id` : désactivation réversible de produit.

## Production baseline

Production requires `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL`. The backend rejects placeholder or short JWT secrets in production. Catalog deletion from the admin dashboard is reversible deactivation, preserving historical references. Before deployment, run `npm test` and `npm run typecheck` in `backend`, then `npm run typecheck`, `npm run build`, and root `npm run lint`.
- `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` : CRUD utilisateurs admin.

Un produit peut recevoir `categories: [categoryId1, categoryId2]`. Le champ `category` est automatiquement synchronisé avec la première catégorie pour compatibilité avec l'ancien frontend.
