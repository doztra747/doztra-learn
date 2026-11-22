# Doztra-Learn

Plateforme e-learning à formateur unique de Doztra SARL : le formateur publie des cours (texte, code coloré, vidéo, PDF, quiz) ; les apprenants s'inscrivent, progressent et obtiennent un certificat.

- Exigences : [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md)
- Avancement : [`docs/plan-implementation.md`](docs/plan-implementation.md)
- Règles de travail : [`CLAUDE.md`](CLAUDE.md)

## Stack

Next.js 16 (App Router, React 19) · TypeScript strict · Tailwind CSS 4 · PostgreSQL via Prisma 7 · Jest et Playwright. Déploiement : Vercel + PostgreSQL Neon.

## Installation locale

Prérequis : Node.js 24, PostgreSQL (18 en développement).

```bash
npm install                      # installe et génère le client Prisma
cp .env.example .env             # puis renseigner DATABASE_URL
npm run db:migrate               # applique les migrations
npm run cli -- owner:create      # crée l'unique compte formateur (mot de passe saisi sans affichage)
npm run dev                      # http://localhost:3000 ; espace formateur : /studio
```

## Vérifications

```bash
npm run lint && npm run typecheck
npm test                         # tests unitaires (base <nom>_test créée automatiquement)
npm run test:e2e                 # tests de bout en bout (build de production + base de test)
```

## Déploiement (Vercel)

- Production : **https://doztra-learn.vercel.app** (projet Vercel `doztra-learn`, équipe `agent-doztra-whatsapp`, fonctions à Francfort `fra1`).
- Base de production : Neon (offre gratuite, Francfort), reliée au projet ; variables `DATABASE_URL` (poolée, application) et `DATABASE_URL_UNPOOLED` (directe, migrations) fournies par l'intégration.
- Le build de production (`npm run vercel-build`) applique les migrations puis construit l'application ; les déploiements de prévisualisation ne modifient pas la base.
- Variables définies dans Vercel : `APP_URL`, `TRUST_PROXY=true` (marquées sensibles).
- Déployer depuis le poste : `npx vercel@65.12.1 deploy --prod` (le fichier `.vercelignore` empêche l'envoi de tout secret local).
- Compte formateur de production : `npm run owner:create:prod` (mot de passe saisi sans affichage ; les variables récupérées sont effacées à la fin).
