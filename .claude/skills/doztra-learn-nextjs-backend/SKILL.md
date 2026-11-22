---
name: doztra-learn-nextjs-backend
description: Utiliser pour écrire ou relire le code serveur de Doztra-Learn en Next.js 16 (App Router) + Prisma + PostgreSQL — découpage de src/server, services, Server Actions, Route Handlers /api/v1, validation zod, transactions, erreurs, cache, pagination, configuration, worker BullMQ, logs et tests Jest.
---

# Doztra-Learn — backend Next.js

Next.js 16 diffère des versions connues : lire `node_modules/next/dist/docs/` avant d'utiliser une API (en particulier `01-app/01-getting-started/07-mutating-data.md`, `08-caching.md`, `15-route-handlers.md`, `16-proxy.md` et `02-guides/data-security.md`).

## Domaines

`auth`, `users`, `catalog`, `courses`, `editor`, `media`, `video`, `learning`, `quiz`, `certificates`, `payments`, `community`, `notifications`, `studio` (tableau de bord, apprenants, paramètres), `health`. Ils reprennent les modules du cahier des charges (§6.2).

Un domaine = un dossier `src/server/<domaine>/`. Il n'expose que les fonctions de son service ; les autres domaines passent par ce service, jamais directement par ses tables (exception documentée : une transaction Prisma interactive orchestrée par un service applicatif).

## Découpage d'un domaine

```
src/server/courses/
  courses.service.ts      # import 'server-only' ; règles RG-xx, transitions d'état
  courses.repository.ts   # requêtes Prisma non triviales (optionnel)
  courses.policy.ts       # qui peut lire/modifier quoi
  courses.dto.ts          # mappeurs modèle Prisma → objet renvoyé (jamais le modèle brut)
  courses.service.test.ts
src/shared/courses/schemas.ts   # schémas zod des entrées (partagés avec les formulaires)
src/app/studio/courses/[id]/actions.ts    # Server Actions (minces)
src/app/api/v1/courses/route.ts         # Route Handler (mince)
```

- **Page (Server Component)** : appelle la couche d'accès puis un service ; ne contient ni règle métier ni appel Prisma.
- **Server Action** (`'use server'`) : `requireUser()`/`requireRole()` → `schema.safeParse(formData)` → appel du service → `revalidateTag`/`revalidatePath` si besoin → retour d'un état minimal pour `useActionState` (`{ ok, fieldErrors, message }`). C'est un point d'entrée HTTP public : on revérifie toujours l'utilisateur, même si la page l'a déjà fait.
- **Route Handler** (`src/app/api/v1/**/route.ts`) : même enchaînement, réponse JSON. Sert l'API publique, les appels des Client Components qui ne passent pas par une action (statuts, progression, signature d'URL) et les webhooks.
- **Service** : règles RG-xx, transactions, mise en file des jobs. Lève des `DomainError`.
- **Réponses** : objets construits par les mappeurs `*.dto.ts` ; ne jamais renvoyer ni passer à un Client Component un modèle Prisma brut (fuite de `password_hash`, champs internes). Activer `experimental.taint` et marquer les objets utilisateur sensibles comme filet de sécurité supplémentaire.

## Pages et API

- Pages : Server Components ; données privées lues à chaque requête (dans un `<Suspense>`), données publiques éventuellement en cache (voir « Cache »).
- API JSON : préfixe `/api/v1`, documentée en OpenAPI 3 générée depuis les schémas zod (`@asteasolutions/zod-to-openapi`, à valider comme nouvelle dépendance) ; document servi hors production seulement.
- Formulaires des pages : Server Actions avec `<form action>` + `useActionState` ; amélioration progressive (le formulaire marche sans JS).
- Limite des corps de Server Actions : 1 Mo par défaut ; relever `serverActions.bodySizeLimit` à 2 Mo pour le contenu Tiptap, pas plus. Les fichiers ne passent jamais par une action (upload direct vers S3, voir `doztra-learn-media-pipeline`).

## Validation (zod)

- Chaque entrée (FormData, JSON, `params`, `searchParams`) est validée par un schéma zod en mode strict (`.strict()`, champs inconnus refusés).
- Chaque texte a `.max()`, chaque nombre `.int().min().max()`, chaque enum `z.enum()`, chaque id `z.uuid()`.
- Contenu Tiptap : validé par le schéma de `src/shared/editor-schema` (voir `doztra-learn-rich-content`), pas par `z.record()` seul.
- Pagination : `page ≥ 1`, `pageSize ≤ 50` ; tri par liste blanche de colonnes.

## Erreurs

- `DomainError(code, message, details?, httpStatus = 422)` dans `src/server/errors.ts`.
- Route Handlers : un utilitaire `handleRoute(fn)` convertit en JSON `{ statusCode, code, message, details }`.
- Server Actions : on renvoie `{ ok: false, code, message }` pour les erreurs métier attendues (affichées dans le formulaire ou un toast) ; les erreurs inattendues remontent vers `error.tsx`.
- Erreurs inattendues : « Une erreur est survenue », détail uniquement dans les logs + Sentry. Jamais de pile ni de requête SQL vers le client (Next.js masque déjà le message en production : ne pas le contourner).
- `notFound()` (et non 403) quand un apprenant demande une ressource d'un cours non publié, pour ne pas révéler son existence. Pages `not-found.tsx` et `error.tsx` en français.

## Cache (Cache Components activé)

- `'use cache'` + `cacheLife()` + `cacheTag()` uniquement pour des données publiques et identiques pour tous : catalogue, fiche d'un cours publié, catégories, page « À propos ».
- Jamais de `'use cache'` sur une fonction qui lit `cookies()`/`headers()`, dépend de l'utilisateur, renvoie une URL signée ou des données de progression, de paiement ou de quiz.
- Après une mutation qui change une donnée publique (publication, archivage, prix, avis) : `revalidateTag('course:<id>')` / `revalidateTag('catalog')` dans l'action ou le service applicatif.
- Données dépendant de la requête : composant enveloppé dans `<Suspense>` avec un squelette.

## Prisma et PostgreSQL

- Client Prisma unique (`src/server/db.ts`, adaptateur `@prisma/adapter-pg`, singleton conservé sur `globalThis` en dev pour le rechargement à chaud). Import : `@/generated/prisma/client`.
- Lecture de données dans une page : composant enveloppé dans `<Suspense>` qui appelle `await connection()` (sinon Next prérend la page avec les données du build).
- Ids UUID v7 générés côté application ; `created_at`, `updated_at` partout ; `deleted_at` sur les contenus.
- Montants `BigInt` ; sérialisation explicite (`amount.toString()`) avant tout passage à un Client Component ou en JSON.
- Opérations multi-tables (paiement → inscription, certificat, réordonnancement) dans `prisma.$transaction` ; niveau `Serializable` ou verrou `SELECT … FOR UPDATE` (via `Prisma.sql`) quand une course entre requêtes est possible (coupons, certificats).
- Contraintes en base en plus du code : uniques (`enrollments(user_id, course_id)`, `certificates(user_id, course_id)`, `orders(provider_reference)`, `reviews(user_id, course_id)`), `CHECK (rating BETWEEN 1 AND 5)`, `CHECK (price >= 0)`.
- Recherche : colonne `search_vector tsvector` maintenue par trigger, index GIN ; extensions `unaccent`, `pg_trgm`, `citext` dans la première migration.
- Réordonnancement : positions entières réécrites dans une transaction (pas de positions flottantes).
- Éviter le N+1 : `include`/`select` ciblés ; les listes ne chargent jamais le contenu JSON des leçons.

## Configuration

- `src/server/env.ts` : schéma zod validé au premier import (et au démarrage via `instrumentation.ts`) ; l'app refuse de démarrer si une variable manque.
- Variables publiques (`NEXT_PUBLIC_*`) seulement pour des valeurs non secrètes (`NEXT_PUBLIC_APP_URL`).
- `.env.example` tenu à jour, sans valeur réelle. Variables en place : `DATABASE_URL`, `APP_URL`, `TRUST_PROXY`, `LOG_LEVEL`. À venir : `REDIS_URL` (files), `S3_*`, `CDN_BASE_URL`, `SMTP_*`, `PAYMENT_PROVIDER`, `PAYMENT_*_SECRET`, `GOOGLE_OAUTH_*`, `SENTRY_DSN`, `APP_URL`, `TZ_DISPLAY=Africa/Conakry`.
- Runtime Node.js partout (Prisma, Redis, `crypto`) : pas de runtime Edge.

## Files BullMQ et worker

- L'application Next.js **produit** les jobs (`src/server/queues.ts`) ; le processus `worker/` les **consomme**. Aucun `Worker` BullMQ dans le processus Next.js.
- Noms : `video-transcode`, `pdf-process`, `mail`, `certificate`, `course-publish-scheduled`, `storage-purge`, `payment-reconcile`.
- Chaque job : `jobId` déterministe pour l'idempotence (ex. `transcode:<mediaId>`), `attempts: 3`, backoff exponentiel, `removeOnComplete`.
- Les données d'un job = ids seulement ; le worker relit l'état en base.
- Le worker réutilise `src/server/<domaine>` et `src/shared` ; il ne doit importer aucun module `next/*`.

## Logs, santé

- Pino (`src/server/logger.ts`), `requestId` posé par `proxy.ts` (en-tête `x-request-id`) et propagé aux jobs ; masquer `authorization`, `cookie`, `password`, `token`, `email`.
- `GET /api/health` (liveness) et `GET /api/health/ready` (PostgreSQL aujourd'hui ; Redis et S3 à leur arrivée), toujours dynamiques (pas de prérendu).

## Tests

- Unitaires (Jest via `next/jest`) : services contre la base PostgreSQL de test `<nom>_test` (créée et migrée par `tests/setup/global-setup.ts`, vidée par `resetDatabase()` de `tests/factories.ts`) ; un `describe` par RG. Pas de Docker en développement ; en CI, un service PostgreSQL.
- Intégration : Route Handlers et Server Actions appelés directement (`await POST(new Request(…))`) avec la session simulée, même base de test.
- Bout en bout (Playwright, canal `msedge` en local, `chromium` en CI) : parcours complets sur `next build && next start` et la base de test ; le compte formateur est créé par `owner:create`.
- Fabriques de données (`tests/factories`) plutôt que des fixtures figées.
- Chaque page et action `/studio` testée en anonyme (redirection connexion / 401), apprenant (403/404), assistant (403 sauf Q&R), owner (200).
