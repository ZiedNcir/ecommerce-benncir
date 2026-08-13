# Import du catalogue INGCO

Ce module construit une base de produits exploitable à partir des pages publiques du catalogue INGCO Tunisie.

## Principes

- lecture progressive des pages `/boutique/` ;
- récupération des fiches `/produit/.../` ;
- priorité aux données structurées JSON-LD ;
- délai entre les requêtes (`INGCO_DELAY_MS`) ;
- aucune suppression automatique de produit ;
- import MongoDB par `upsert`, donc relançable sans doublons ;
- conservation de l'URL source et de la date d'import ;
- association automatique avec les sous-catégories BÊN NCÎR.

## Commandes

```bash
cd backend
npm run seed:categories
npm run scrape:ingco
npm run import:ingco
```

Ou en une seule commande :

```bash
npm run catalog:ingco
```

## Test limité

Avant un import complet :

```bash
INGCO_MAX_PAGES=1 INGCO_MAX_PRODUCTS=5 INGCO_DELAY_MS=1800 npm run scrape:ingco
npm run import:ingco
```

## Import complet

```bash
INGCO_MAX_PAGES=40 INGCO_MAX_PRODUCTS=0 INGCO_DELAY_MS=1400 npm run catalog:ingco
```

Le fichier intermédiaire est enregistré dans `backend/data/ingco-products.json`.

## Important

Vérifier les droits d'utilisation commerciale des images, descriptions, marques et données avant publication. Le script est volontairement limité en fréquence et doit être exécuté de façon raisonnable.
