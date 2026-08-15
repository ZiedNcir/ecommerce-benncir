# Déploiement BÊN NCÎR Commerce

## Alignement frontend/backend

- Le frontend utilise `VITE_API_URL` comme URL unique de l’API.
- Le mode de démonstration est désactivé par défaut avec `VITE_ENABLE_DEMO=false`.
- Les erreurs API ne sont plus masquées par de fausses données en production.
- La page d’accueil charge les catégories, produits vedettes et nouveautés depuis MongoDB.
- Le checkout envoie uniquement les références produit, les quantités et les informations client.
- Le backend relit les prix et le stock depuis MongoDB, puis calcule lui-même le sous-total, les 7 DT de livraison et le total.
- Le dashboard, les commandes, les catégories et les produits utilisent les mêmes routes et structures de données.

## Lancement local

Backend :

```bash
cd backend
cp .env.example .env
npm install
npm run seed:categories
npm run dev
```

Frontend :

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Déploiement Docker

1. Copier `.env.deploy.example` vers `.env`.
2. Renseigner le domaine frontend, l’URL API et un secret JWT long.
3. Lancer :

```bash
docker compose up -d --build
```

Le frontend est exposé sur le port `8080`, le backend sur `5000` et MongoDB reste interne au réseau Docker.

## Mise en production séparée

### Frontend

- Commande de build : `npm ci && npm run build`
- Dossier publié : `dist`
- Variable : `VITE_API_URL=https://api.votre-domaine.tn/api`
- Variable : `VITE_ENABLE_DEMO=false`
- Configurer une réécriture SPA vers `index.html`.

### Backend

- Commande : `npm ci --omit=dev && npm start`
- Variables obligatoires : `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`
- `CLIENT_URL` accepte plusieurs domaines séparés par des virgules.
- En production, `JWT_SECRET` doit être aléatoire et contenir au moins 32 caractères ; les valeurs de démonstration sont refusées.
- Les suppressions de produits et catégories sont des désactivations réversibles afin de préserver l’historique des commandes.
- Point de contrôle : `/api/health`

## Première administration

Tant qu’aucun administrateur n’existe, ouvrir `/admin/setup`. Après création du premier compte, cette route backend refuse automatiquement toute nouvelle initialisation.
