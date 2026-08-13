# BÊN NCÎR COMMERCE — mise à jour V8

## Fonctions ajoutées

### Recherche assistée

- Suggestions de produits pendant la saisie.
- Suggestions de catégories correspondant au texte.
- Respect du filtre de catégorie choisi dans le header.
- Accès direct à une fiche produit depuis les résultats.

### Messages clients

- Le formulaire Contact enregistre maintenant les demandes dans MongoDB.
- Validation des champs côté API.
- Nouvelle rubrique **Messages** dans le dashboard.
- Recherche, filtres de statut, consultation, notes internes et suppression.
- L'administrateur peut ouvrir une réponse email préremplie.

### Images produits dans le dashboard

- Bouton de consultation depuis la liste des produits.
- Galerie agrandie de toutes les images du produit.
- Accès à l'image originale dans un nouvel onglet.

### Commandes et stock

- Réservation atomique du stock lors de la commande.
- Protection contre une commande supérieure au stock disponible.
- Restauration du stock lors d'une annulation ou d'une suppression.
- Une commande annulée ne peut pas être réactivée par erreur.
- Historique horodaté de tous les changements de statut.
- Détail admin enrichi : compte, adresse complète, note client, livraison,
  paiement, email, état du stock et historique.
- Les frais affichés proviennent désormais des données de la commande.

### Fiche produit

- Quantité plafonnée par le stock réellement disponible.
- Désactivation de l'achat en rupture de stock.
- Confirmation visuelle après ajout au panier.
- Remplacement du champ Mongoose réservé `isNew` par `newArrival`.

### Sécurité et maintenance

- En-têtes HTTP de sécurité avec Helmet.
- Limitation du débit sur l'authentification et les écritures publiques.
- Fichiers `.env` retirés de la distribution et remplacés par des exemples.
- `.gitignore` ajouté.
- Fichiers `package-lock.json` resynchronisés.
- Corrections TypeScript front et back.

## Vérifications effectuées

```bash
cd frontend
npm run typecheck
npm run build

cd ../backend
npm run typecheck
```

Les nouveaux modules du backend ont également été chargés avec Node et `tsx`
pour vérifier leur transformation et leurs imports.

## Mise en route

1. Copier `backend/.env.example` vers `backend/.env`.
2. Renseigner au minimum `MONGO_URI`, `JWT_SECRET` et `CLIENT_URL`.
3. Copier `frontend/.env.example` vers `frontend/.env`.
4. Installer les dépendances avec `npm ci` dans `frontend` puis `backend`.
5. Lancer l'API avec `npm run dev` dans `backend`.
6. Lancer le site avec `npm run dev` dans `frontend`.

