# Admin products/new V4 — alignement frontend/backend

## Page d'administration
- Nouvelle colonne droite de contrôle : aperçu, statut, visibilité, résumé, qualité, SEO, historique et actions.
- États de publication : brouillon, publié, masqué.
- Visibilité séparée : site, recherche, accueil.
- Aperçu produit en temps réel avec galerie, stock, SKU, marque, prix et description courte.
- Score de complétude calculé sur dix critères.

## Backend
Le modèle Product accepte désormais :
- publicationStatus
- visibleOnSite
- visibleInSearch
- visibleOnHome

Les listes publiques excluent les produits masqués ou non visibles sur le site. Les recherches respectent visibleInSearch et le filtre home peut sélectionner visibleOnHome.

## Front public
La fiche produit utilise la description courte en introduction et affiche les caractéristiques techniques et les tags issus de la création produit.
