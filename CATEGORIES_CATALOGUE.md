# Catalogue catégories

Le catalogue a été structuré à partir des familles visibles sur ingco.tn, puis regroupé en catégories principales et sous-catégories adaptées au système hiérarchique du projet.

## Importer uniquement les catégories

Dans `backend` :

```bash
npm run seed:categories
```

Cette commande crée ou met à jour les catégories sans supprimer les utilisateurs, produits ou commandes existants.

## Réinitialiser toute la base de démonstration

```bash
npm run seed
```

Attention : cette commande supprime les données existantes avant de recréer les données de démonstration.
