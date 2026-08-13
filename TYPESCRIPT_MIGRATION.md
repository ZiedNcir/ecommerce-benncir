# Migration TypeScript — BÊN NCÎR Commerce V7

## Changements réalisés

- Migration de tous les fichiers `frontend/src` de JavaScript/JSX vers TypeScript/TSX.
- Migration de tous les fichiers `backend/src` vers TypeScript.
- Ajout des configurations `tsconfig.json` frontend et backend.
- Ajout des dépendances TypeScript, des types React, Node, Express et bibliothèques backend.
- Remplacement des commandes backend Node/Nodemon par `tsx`.
- Ajout des scripts `typecheck`.
- Mise à jour du point d'entrée Vite vers `src/main.tsx`.
- Mise à jour des scripts ESLint pour `.ts` et `.tsx`.

## Bannière principale

La bannière d'accueil est désormais fixe :

- un seul visuel principal stable ;
- hauteur contrôlée sur ordinateur et mobile ;
- suppression de la rotation automatique, des flèches et des points du slider ;
- contenu BÊN NCÎR Commerce multi-catégories ;
- positionnement d'image optimisé selon la taille d'écran.

## Commandes

Frontend :

```bash
cd frontend
npm install
npm run typecheck
npm run build
```

Backend :

```bash
cd backend
npm install
npm run typecheck
npm run dev
```

> Les dépendances npm doivent être installées avant le contrôle TypeScript et le build.
