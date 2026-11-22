# CLAUDE.md — Doztra-Learn

@AGENTS.md

Plateforme e-learning **à formateur unique** : le propriétaire publie des cours (texte riche avec code coloré et captures, vidéo avec miniature, PDF, quiz) ; les apprenants s'inscrivent, progressent, obtiennent un certificat. Porteur : Doztra SARL (bayo.ibrahima@doztra.com · +224 623 04 47 82).

Sources de vérité, dans cet ordre :
1. `docs/cahier-des-charges.md` — exigences F-xx, règles RG-xx, modèle de données, API, critères de recette.
2. `docs/prototype/Doztra-Learn.dc.html` (site apprenant) et `docs/prototype/Doztra-Learn Admin.dc.html` (espace formateur) — rendu visuel attendu.
3. Ce fichier et les skills de `.claude/skills/`.

En cas de conflit entre le prototype et le cahier des charges : le cahier des charges gagne sur le **comportement**, le prototype gagne sur le **visuel**. Signaler tout conflit plutôt que trancher en silence.

> **Changement de stack (décision du 22/11/2026).** Le projet est passé de NestJS à **Next.js** ; le cahier des charges (v1.1, §1.1, §4, §6) a été aligné. Tout le reste (F-xx, RG-xx, modèle de données, API `/api/v1`, écrans, recette) est inchangé.

## Next.js 16 : lire la doc locale

La version installée (Next.js 16.4, React 19.3) diffère de ce que l'on croit savoir : `middleware.ts` s'appelle maintenant **`proxy.ts`**, **Cache Components** est activé (`cacheComponents: true`, directive `'use cache'`), les `GET` des Route Handlers sont prérendus comme les pages, etc. Avant d'utiliser une API Next.js, lire le guide correspondant dans `node_modules/next/dist/docs/` (voir `AGENTS.md`).

## Skills à charger

| Tâche | Skill |
| --- | --- |
| Toute fonctionnalité touchant cours, leçons, progression, quiz, certificats, avis, rôles | `doztra-learn-business-rules` |
| Code serveur Next.js : services, Server Actions, Route Handlers, Prisma, zod, erreurs, tests | `doztra-learn-nextjs-backend` |
| Authentification, sessions, uploads, URL signées, en-têtes, revue de sécurité | `doztra-learn-security` |
| Pages et composants React, Tailwind, icônes, écrans du prototype | `doztra-learn-ui` |
| Éditeur Tiptap, rendu HTML, blocs de code Shiki, captures d'écran | `doztra-learn-rich-content` |
| Upload vidéo/PDF, worker BullMQ, FFmpeg/HLS, miniatures | `doztra-learn-media-pipeline` |
| Commandes, Mobile Money/carte, webhooks, coupons, reçus | `doztra-learn-payments` |

Une tâche en touche souvent plusieurs : charger tous ceux qui s'appliquent **avant** d'écrire du code.

## Stack (ne pas substituer sans accord)

- **Next.js 16** (App Router, Turbopack, Cache Components) + **React 19**, TypeScript `strict`. Une seule application sert les pages **et** l'API `/api/v1` (Route Handlers).
- Rendu **Server Components** par défaut ; **Client Components** (`'use client'`) seulement pour l'interactivité (éditeur Tiptap, lecteur vidéo, visionneuse PDF, menus, modales). Mutations des pages par **Server Actions**.
- Logique métier dans `src/server/` (modules marqués `import 'server-only'`), jamais dans les composants ni les actions.
- Validation des entrées par **zod** (schémas partagés dans `src/shared/`).
- **Tailwind CSS 4** (jetons dans `src/app/globals.css`, bloc `@theme`).
- **PostgreSQL** (18 en développement ; version de production à fixer) via **Prisma 7** (adaptateur `pg`, client généré dans `src/generated/prisma`) ; sessions et compteurs de connexion (RG-04) **dans PostgreSQL** (décision du 22/11/2026) ; **Redis 7** + **BullMQ** pour les files de tâches du worker, à leur arrivée.
- Processus **worker** séparé (même dépôt, dossier `worker/`) pour FFmpeg, PDF, e-mails, certificats. Jamais de traitement long dans une requête Next.js.
- Stockage objet **compatible S3** (MinIO en dev). Jamais de fichier utilisateur sur le disque de l'app.
- Icônes : **Font Awesome 6 Classic** uniquement (Solid, Regular), paquets npm `@fortawesome/*` (pas de CDN, pas de Brands, pas de Pro).
- Polices : Plus Jakarta Sans + JetBrains Mono via `next/font` (auto-hébergées au build, aucune requête vers Google à l'exécution).
- Tests : Jest 30 (`next/jest`, Node lancé avec `--experimental-vm-modules` pour le runtime ESM de Prisma) sur une base PostgreSQL de test réelle ; Playwright (Edge du poste) pour le bout en bout. Docker (production uniquement), Nginx, GitHub Actions.

## Arborescence cible

```
src/
  app/                    # routes App Router
    (site)/               # pages publiques : accueil, catalogue, fiche cours, auth
    (learn)/              # espace apprenant connecté
    studio/               # espace formateur (OWNER, ASSISTANT pour Q&R)
    api/v1/**/route.ts    # API JSON + webhooks
    globals.css           # Tailwind 4 + jetons @theme
  components/             # composants React : ui/, course/, learn/, studio/, editor/
  server/                 # 'server-only' : env, db, redis, queues, storage, logger, errors
    auth/                 # sessions (PostgreSQL), mots de passe Argon2id, DAL : getCurrentUser(), requireUser(), requireOwner()
    <domaine>/            # <domaine>.service.ts, .policy.ts, .test.ts
  shared/                 # utilisable client + serveur : types, constantes RG, schémas zod, schéma Tiptap
  proxy.ts                # en-têtes (CSP nonce), requestId, redirections optimistes
worker/                   # consommateurs BullMQ (réutilise src/server et src/shared)
prisma/                   # schema.prisma, migrations/, seed.ts
scripts/                  # CLI (owner:create…)
tests/e2e/                # Playwright
docs/                     # cahier des charges, prototype
docker/                   # Dockerfiles, nginx.conf
```

## Commandes

Gestionnaire de paquets : **npm** (`package-lock.json`). Développement **sans Docker** : PostgreSQL 18 installé localement (service Windows `postgresql-x64-18`), identifiants dans `.env` (copie de `.env.example`, jamais commitée).

```bash
npm install                       # lance aussi « prisma generate » (postinstall)
npm run db:migrate                # applique les migrations versionnées (prisma migrate deploy)
npm run dev                       # Next.js ; /studio exige une connexion avec le compte formateur
npm run build                     # build de production
npm run lint && npm run typecheck
npm test                          # Jest sur la base <nom>_test (créée et migrée automatiquement)
npm run test:coverage
npm run test:e2e                  # Playwright (Edge du poste) sur un build de production et la base de test ; arrêter « npm run dev » n'est pas nécessaire
npm run db:migration:new -- --name <nom>   # crée une migration SANS l'appliquer (à relire/compléter), puis db:migrate
npm run db:status
npm run worker:dev                # worker BullMQ (à créer)
npm run cli -- owner:create       # crée l'unique compte formateur (RG-05) ; mot de passe saisi sans affichage
npm run owner:create:prod         # même commande sur la base de production Neon (variables Vercel récupérées puis effacées)
npx vercel@65.12.1 deploy --prod  # déploiement de production depuis le poste (https://doztra-learn.vercel.app)
```

- Ne pas lancer `prisma migrate dev` sans `--create-only` dans un terminal non interactif : il attend une réponse et bloque.
- Les tests ne touchent **jamais** la base de travail : `tests/setup/test-database.ts` impose un nom de base en `_test`.
- Ajouter les scripts marqués « à créer » quand l'outil correspondant arrive, puis mettre ce bloc à jour.

## Règles non négociables

1. **Formateur unique.** Un seul compte `OWNER`. Pas d'inscription formateur, pas de revue par un tiers, pas de partage de revenus. Rôles : `LEARNER`, `ASSISTANT`, `OWNER`.
2. **Le serveur fait foi.** Toute règle RG-xx est appliquée dans un service de `src/server/`, testée, jamais seulement dans un composant.
3. **Accès vérifié à chaque requête, au plus près des données** : chaque page, Server Action et Route Handler appelle la couche d'accès (`requireUser()`, `requireRole()`, `assertCanAccessLesson()`…). `proxy.ts` et les layouts ne servent qu'aux redirections optimistes, jamais de seule barrière. Une Server Action est un point d'entrée public : elle revérifie toujours l'utilisateur.
4. **Aucun fichier privé en URL publique** : URL signées courtes, émises après contrôle d'accès.
5. **HTML de l'éditeur toujours nettoyé côté serveur** à l'enregistrement ; `dangerouslySetInnerHTML` réservé au `content_html` déjà nettoyé et stocké, jamais à une donnée brute.
6. **Paiement confirmé uniquement par webhook signé et idempotent**, jamais par le retour navigateur.
7. **Secrets uniquement par variables d'environnement validées au démarrage** (zod, `src/server/env.ts`) ; jamais dans le code, les logs, ni les messages d'erreur. Aucune variable secrète préfixée `NEXT_PUBLIC_`.
8. **Pas de donnée privée dans un cache partagé** : `'use cache'` seulement pour des données publiques (catalogue, fiche cours publiée) ; jamais pour ce qui dépend de la session ou contient une URL signée.
9. **Migrations Prisma versionnées**, jamais `db push` hors dev ; pas de modification d'une migration déjà appliquée.
10. Montants en `BigInt` GNF (pas de flottants), dates en UTC en base, affichage fuseau `Africa/Conakry`.
11. Interface **en français** (`<html lang="fr">`), mobile first (360 px), accessible WCAG 2.1 AA.

## Façon de travailler

- Avant de coder : identifier les F-xx / RG-xx concernées et les citer dans le commit ou la PR.
- Petites unités livrables : migration → service + tests → Server Action / Route Handler → page → test e2e.
- Un test par règle de gestion touchée (nommé avec son identifiant : `it('RG-31 : vidéo terminée à 90 %')`).
- Pas de dépendance nouvelle sans justification (maintenue, licence MIT/Apache/BSD, pas de doublon fonctionnel).
- Ne jamais désactiver une règle ESLint, un test ou une vérification de type pour « faire passer ».
- Toute requête SQL brute passe par `Prisma.sql` (paramétrée). Jamais de concaténation.
- Logs structurés (Pino) sans donnée personnelle ni secret ; un `requestId` par requête (posé par `proxy.ts`).
- Conventional Commits (`feat(courses): …`, `fix(payments): …`).

## Définition de « terminé »

- [ ] Lint, typecheck, tests verts ; couverture ≥ 70 % sur les services métier touchés.
- [ ] Règles RG-xx concernées testées, y compris les cas de refus.
- [ ] Contrôle d'accès testé (non connecté, apprenant non inscrit, assistant, owner).
- [ ] Écran conforme au prototype (couleurs, rayons, icônes) et utilisable à 360 px.
- [ ] Navigation clavier et textes alternatifs vérifiés.
- [ ] Pas de secret, pas de `console.log`, pas de `TODO` sans ticket.
- [ ] Documentation OpenAPI à jour pour toute route `/api/v1` ajoutée.
