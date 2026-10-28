# CV Studio — Créateur de CV A4

Application Next.js avec éditeur de CV, aperçu live, impression/export PDF via la boîte de dialogue du navigateur et sauvegarde Prisma.

## Fonctionnalités
- Formulaires pour profil, photo, expériences, diplômes/formations, projets, compétences, langues, qualités et disponibilité.
- Données de départ préremplies à partir du CV fourni (à vérifier et modifier avant utilisation).
- Deux dispositions (colonne latérale ou classique), couleur personnalisable et choix de police.
- Mise en page A4 portrait conçue pour une page, CSS d'impression dédiée.
- Prisma avec SQLite en local; l'API conserve un brouillon local si la base n'est pas configurée.
- Upload d'image limité à 3 Mo (stockage local dans `public/uploads`, adapté au développement local).

## Lancer en local
Prérequis : Node.js 20.9+ et npm.

```bash
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

Puis ouvrir http://localhost:3000.

## Base de données
Par défaut, Prisma utilise SQLite (`file:./dev.db`) pour faciliter le démarrage local.
Pour un déploiement serverless (par exemple Vercel), remplacez le provider SQLite par PostgreSQL dans `prisma/schema.prisma`, configurez `DATABASE_URL` avec une base PostgreSQL hébergée, puis exécutez `npx prisma generate` et `npx prisma db push`. Ne comptez pas sur le disque local de Vercel pour conserver les fichiers uploadés : utilisez un stockage d'objets pour les photos en production.

## Export PDF
Cliquez sur « Imprimer / PDF » puis choisissez « Enregistrer au format PDF » dans la boîte de dialogue. Dans les options d'impression, activez les graphiques d'arrière-plan si vous voulez conserver les couleurs. Le CSS définit un format A4 sans marges et masque l'interface d'édition. Le contenu très long peut nécessiter de raccourcir quelques descriptions pour garantir qu'il tienne visuellement sur une seule page.

## Avant mise en production
- Ajouter authentification et autorisation avant d'exposer les CV enregistrés.
- Valider et nettoyer les données entrantes.
- Utiliser PostgreSQL et un stockage d'images durable en production.
- Adapter le stockage multi-utilisateur (ownerId) si plusieurs personnes doivent avoir leurs CV séparés.
