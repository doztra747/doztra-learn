# Plan d'implémentation — Doztra-Learn

22/11/2026 · référence : `docs/cahier-des-charges.md` v1.1, prototypes `docs/prototype/`, `CLAUDE.md`.

Ce plan découpe le MVP 1.0 en 8 phases livrables. Il suit le planning du cahier (§8.3, 16 semaines). La phase 0 a construit l'interface apprenant avec des données de démonstration ; **à partir de la phase 1, chaque écran est branché directement sur PostgreSQL**, sans données temporaires.

## Principes

- **Données réelles dès la phase 1.** Les écrans lisent et écrivent dans PostgreSQL via Prisma. Les données de démonstration de la phase 0 (`src/server/demo/`) sont supprimées au fur et à mesure que chaque domaine est branché ; aucune nouvelle donnée fictive n'est ajoutée.
- **Pas de Docker en développement.** PostgreSQL est installé localement (service Windows `postgresql-x64-18`). Docker reste un livrable de déploiement (cahier §8.4), traité en phase 8.
- **Une phase = une version utilisable.** Chaque phase se termine par une démonstration et respecte la « Définition de terminé » de `CLAUDE.md`.
- **Ordre dans une phase :** migration Prisma → service + tests RG → Server Actions / Route Handlers → branchement des écrans → test e2e Playwright.
- **Le serveur fait foi** pour toutes les règles RG-xx, même quand l'écran existe déjà.

## Vue d'ensemble

| Phase | Semaines | Contenu | Exigences | Jalon | État |
| --- | --- | --- | --- | --- | --- |
| 0. Interface apprenant | S1-S2 | Composants, 10 écrans du site apprenant avec données de démonstration | F-10, F-11, F-13, F-61, F-64 (visuel) | Parcours cliquable de l'accueil au certificat | **Terminée** |
| 1. Données et espace formateur | S2-S4 | Prisma + PostgreSQL local, schéma et migrations, écrans `/studio` branchés sur la base, catalogue public relu depuis la base | F-10, F-11, F-12 (titre), F-13, F-20, F-21, F-24, F-93 (partiel), F-95, RG-10, RG-14, RG-16 | Un cours créé et structuré dans le studio est enregistré en base ; RG-10 indique ce qui manque pour le publier | **Terminée** |
| 2. Socle technique + connexion formateur | S4 | Variables d'env validées, logs, proxy + CSP à nonce, en-têtes, santé, CI ; connexion obligatoire au studio (sessions PostgreSQL, RG-02, RG-04, RG-05) | F-02 (formateur), F-06 (sans TOTP), RG-02, RG-04, RG-05 | `/studio` inaccessible sans connexion formateur, `/api/health/ready` | **Terminée** |
| 3. Comptes apprenants | S4-S5 | Inscription et vérification e-mail, mot de passe oublié, Google, profil, suppression, TOTP formateur, assistant ; pages apprenant branchées | F-01, F-03 à F-07, RG-01, RG-03 | Un apprenant crée son compte et se connecte | À faire |
| 4. Éditeur de contenu | S5-S7 | Éditeur Tiptap, Shiki, images collées, versions, publication programmée | F-22, F-23, F-25, F-26, F-30 à F-39, RG-11 à RG-13, RG-15 | Premier cours textuel publié | À faire |
| 5. Vidéo et PDF | S8-S10 | Upload reprenable, worker FFmpeg/HLS, miniatures, lecteur, PDF.js | F-40 à F-55, RG-11, RG-20 à RG-22 | Vidéo lue en 3 qualités | À faire |
| 6. Apprentissage | S11-S12 | Inscriptions, progression, quiz, certificats | F-60 à F-74, RG-30 à RG-42 | Parcours complet jusqu'au certificat | À faire |
| 7. Paiement et communauté | S13-S14 | Commandes, agrégateur, webhooks, coupons, reçus, Q&R, avis, notifications | F-80 à F-92, RG-50 à RG-54 | Premier achat réel en recette | À faire |
| 8. Administration et lancement | S15-S16 | Tableau de bord complet, modération, audit, exports, charge, sécurité, Docker de production | F-93 à F-98, §5, §8.4, §8.5 | Mise en ligne | À faire |

## Phase 0 — Interface apprenant (terminée le 22/11/2026)

Reproduction de `Doztra-Learn.dc.html` en Next.js, mobile first, avec des données de démonstration (`src/server/demo/data.ts`).

| Écran | Route |
| --- | --- |
| Accueil | `/` |
| Catalogue et recherche (filtres, tri et recherche sans accents dans l'URL) | `/courses` |
| Fiche cours + modale de paiement (formulaire, attente, confirmé) | `/courses/[slug]` |
| Connexion / inscription, mot de passe oublié | `/login`, `/register`, `/forgot-password` |
| Lecteur de cours (texte avec code coloré, vidéo, PDF, quiz, progression, mode concentration) | `/learn/[courseSlug]/[lessonId]` |
| Mes cours (en cours, terminés), mes certificats | `/my-courses`, `/my-certificates` |
| À propos du formateur | `/about` |
| Vérification de certificat (formulaire + page publique du QR code) | `/certificates`, `/certificates/[code]` |

Composants livrés (`src/components/`) : `Icon`, `Logo`, `SiteHeader`, `SiteFooter`, `CourseCard`, `FavoriteButton`, `SortSelect`, `PaymentDialog`, `AuthForm`, `CoursePlayer`, `ProgressBar`, `Stars`, `Callout`, `CodeBlock`, `CopyButton`, `QuizDemo`, `CertificatePreview`.

Vérifié : build, lint, typecheck ; chaque route en production ; captures à 360 px et 1280 px ; aucun attribut `style` dans le HTML (compatible CSP) ; `lang="fr"`, lien « Aller au contenu », focus visible, montants `fr-GN` avec espace insécable.

### Écarts par rapport au prototype

| Écart | Raison |
| --- | --- |
| Paiement par carte : redirection annoncée vers la page de l'opérateur, pas de champ « numéro de carte » | Le comportement (skill paiements, sécurité) l'emporte sur le visuel : Doztra-Learn ne doit jamais voir un numéro de carte |
| Lien « Espace formateur » de l'en-tête retiré | Ajouté avec la phase 1 |
| Liens « Paiement Mobile Money » et « Confidentialité » du pied de page retirés ; « Contact » en lien e-mail | Pas de page correspondante ; pas de lien mort |
| Catégorie sans cours affichée « 0 cours » | Le prototype affichait un nombre fictif |
| Couleurs du code reprises du script du prototype (chaînes, fonctions, commentaires) | Thème du skill UI mis à jour en conséquence |
| Photos remplacées par des emplacements neutres | Visuels à fournir par Doztra |
| Font Awesome fixé en version 6 | `CLAUDE.md` impose FA 6 Classic ; npm installait la 7 |

## Phase 1 — Données et espace formateur (terminée le 22/11/2026)

Reproduction de `Doztra-Learn Admin.dc.html` sous `/studio`, branchée directement sur PostgreSQL ; catalogue public relu depuis la base.

### Livré

| Élément | Détail |
| --- | --- |
| Base de données | Prisma 7.10 (adaptateur `pg`), migration `init` : `users`, `user_roles` (index unique partiel : un seul OWNER, RG-05), `media`, `categories`, `tags`, `course_tags`, `courses`, `course_objectives`, `sections`, `lessons` ; extensions `citext`, `unaccent`, `pg_trgm` ; contraintes `CHECK` (prix ≥ 0, prix barré > prix, positions, durées, tailles) ; index trigramme sur le titre |
| Services | `categories` (2 niveaux, slug unique, suppression refusée si utilisée ou parente) ; `courses` (création, informations, prix en `BigInt`, slug RG-16 avec reprise sur conflit, checklist et publication RG-10, archivage, suppression RG-14, sections et leçons : ajout, renommage, suppression, réordonnancement, aperçu gratuit) ; `catalog` (cours publiés uniquement, recherche sans accents par `unaccent` paramétrée, filtres) |
| Studio | Tableau de bord, Mes cours (onglets par statut), Nouveau cours, éditeur (Informations, Programme, Prix, Publication), Catégories ; Import vidéo, Apprenants, Questions et avis, Paiements : états vides explicites |
| Site public | Accueil, catalogue et fiche cours lus depuis la base ; brouillons et cours archivés en 404 |
| Accès provisoire | `requireStudioAccess()` dans chaque page et chaque Server Action : studio en 404 en production tant qu'il n'y a pas d'authentification ; lien « Espace formateur » masqué en production |
| Tests | 33 tests Jest sur base de test réelle (couverture des services 81 %) ; 3 parcours Playwright dans Edge (création complète d'un cours, catégorie utilisée, studio à 360 px au clavier) |

### Écarts par rapport au prototype

| Écart | Raison |
| --- | --- |
| Indicateurs du tableau de bord : cours publiés, brouillons, leçons, catégories (au lieu d'inscrits, revenus, complétion, questions) ; blocs revenus et questions en état vide | Pas de données d'inscription ni de paiement avant les phases 6-7 : aucun chiffre fictif |
| Cartes de « Mes cours » : leçons et prix (au lieu d'inscrits et complétion) ; boutons Prévisualiser et Dupliquer absents | Mêmes raisons ; prévisualisation en phase 4, duplication (F-25, priorité C) plus tard |
| Réordonnancement par boutons Monter / Descendre, sans glisser-déposer | Accessible au clavier et sans dépendance ; le glisser-déposer (`@dnd-kit`) reste une proposition |
| Entrée « Éditeur de cours » retirée de la barre latérale, entrée « Catégories » ajoutée | L'éditeur s'ouvre depuis un cours ; F-95 n'avait pas d'écran dans le prototype |
| Recherche globale, notifications et bloc « Stockage » de la barre latérale absents ; bloc « Accès local » à la place du profil | Pas de comptes ni de médias avant les phases 3 et 5 |
| « Programmer la publication » affiché mais désactivé | Nécessite le worker (RG-12), phase 4 |
| Fiche cours publique : pas d'aperçu gratuit cliquable, inscription gratuite désactivée | Le contenu des leçons (phase 4) et les inscriptions (phase 6) n'existent pas encore |

### Conséquence à connaître

Aucun cours ne peut encore être publié : RG-10 exige une image de couverture (phase 5) et 3 leçons publiables, c'est-à-dire avec contenu (phases 4 à 6). Le catalogue public reste donc vide (« Aucun cours publié pour l'instant ») jusque-là ; c'est le comportement attendu, pas un défaut.

### Reste en données de démonstration

Lecteur de cours, Mes cours, Mes certificats et vérification de certificat (`src/server/demo/data.ts`), branchés en phases 3 et 6.

## Phase 2 — Socle technique et connexion formateur (terminée le 22/11/2026)

Décisions du 22/11/2026 : sessions et compteurs de connexion **dans PostgreSQL** (pas de Redis pour l'instant) ; double authentification (TOTP, F-06) **reportée** à la phase 3.

### Livré

| Élément | Détail |
| --- | --- |
| Configuration | `src/server/env.ts` (zod) validé au démarrage par `src/instrumentation.ts` ; une variable manquante arrête l'application en nommant la variable, jamais sa valeur ; `.env.example` complété |
| Journaux | Pino (`src/server/logger.ts`), champs sensibles masqués (mot de passe, jeton, e-mail, téléphone, cookies) ; `x-request-id` posé par le proxy |
| CSP et en-têtes | `src/proxy.ts` : CSP stricte à nonce par requête (`script-src 'self' 'nonce-…' 'strict-dynamic'`, `style-src 'self' 'nonce-…'`, `frame-ancestors 'none'`…) ; pages rendues à chaque requête (prérendu partiel désactivé, incompatible avec la nonce) ; `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS en production, `X-Powered-By` retiré. Vérifié : aucun script sans nonce, aucune violation CSP dans Edge |
| Santé | `GET /api/health` et `GET /api/health/ready` (PostgreSQL ; 503 sans détail technique si indisponible) |
| Connexion | Page `/login` réelle (Server Action) ; Argon2id (`@node-rs/argon2`, m=19 Mio, t=2) ; message unique « E-mail ou mot de passe incorrect » et temps constant ; « se souvenir de moi » (7 j / 30 j glissants) ; retour vers la page demandée (chemins internes seulement) ; déconnexion qui détruit la session en base |
| Sessions | Table `sessions` : seul le SHA-256 du jeton est stocké ; cookie `__Host-dzl.sid` `HttpOnly`, `Secure`, `SameSite=Lax` ; compte bloqué ou session expirée refusés |
| RG-04 | Table `login_attempts` (clés hachées) : 5 échecs en 15 min bloquent 15 min, par e-mail et par IP (IP comptée seulement derrière Nginx, `TRUST_PROXY=true`) |
| Studio protégé | Redirection optimiste dans le proxy ; contrôle qui fait foi par `requireOwner()` dans chaque page (`<OwnerOnly>`) et chaque Server Action ; utilisateur connecté sans rôle OWNER → 404 ; bouton « Se déconnecter » ; lien « Espace formateur » de nouveau visible |
| RG-05 | `npm run cli -- owner:create` : unique façon de créer le formateur (saisie masquée du mot de passe, confirmation) ; second formateur refusé par le service et par l'index unique partiel |
| Base | Migrations `auth_sessions` et `restore_title_trgm_index` (l'index trigramme, ajouté à la main en phase 1, est désormais déclaré dans le schéma pour que Prisma ne le supprime plus) ; aucune dérive schéma/base |
| CI | `.github/workflows/ci.yml` : PostgreSQL 18 en service, migrations, lint, types, tests avec couverture, audit `npm audit --omit=dev`, tests de bout en bout (Chromium), scan de secrets gitleaks. **Non exécuté** : le projet n'est pas encore sur GitHub |
| Tests | 51 tests Jest (dont RG-02, RG-04, RG-05, sessions, redirections ouvertes) ; 6 tests Playwright sur le build de production (connexion obligatoire, mauvais mot de passe, cookie sécurisé, déconnexion, jeton forgé refusé, parcours complet du formateur) |

### Reste pour la phase 3

Inscription des apprenants et vérification de l'e-mail (F-01, RG-01, RG-03), mot de passe oublié (F-03), Google (F-04), profil (F-05), double authentification du formateur (F-06), suppression du compte (F-07), rôle assistant, branchement des pages apprenant (lecteur, mes cours, certificats) sur la session.

## Phase 3 — Comptes apprenants

- Inscription, vérification e-mail (nécessite l'envoi d'e-mails : SMTP ou Mailpit local), mot de passe oublié, Google OAuth, profil, suppression (F-01, F-03 à F-07).
- TOTP obligatoire pour le formateur (`otplib`, codes de secours hachés).
- Rôle `ASSISTANT` attribué par le formateur (RG-05).
- Écrans de la phase 0 branchés sur la session ; historique des achats et profil.
- Tests d'accès des 4 profils (anonyme, apprenant, assistant, formateur) sur `/studio` et `/learn`.

## Phase 4 — Éditeur de contenu

- Éditeur Tiptap (Client Component), schéma partagé, rendu serveur, Shiki à classes, `sanitize-html`, images collées, encadrés, import Markdown, sommaire.
- Brouillon automatique, prévisualisation, versions (RG-13), publication programmée (RG-12), durée du cours (RG-15).
- Recherche plein texte sur le contenu des leçons (F-12), cache public (`'use cache'` + `revalidateTag`).

## Phase 5 — Vidéo et PDF

- Upload multipart S3 présigné et reprenable, contrôle magic bytes, limites RG-21.
- Worker : `video-transcode` (FFmpeg → HLS 360p/720p/1080p), miniatures, `pdf-process`, `storage-purge`.
- Lecteur Video.js + hls.js (reprise, vitesse, qualité, sous-titres), visionneuse PDF.js, URL signées.

## Phase 6 — Apprentissage

- Inscription gratuite, progression (RG-30 à RG-32), reprise à la dernière leçon, notes personnelles.
- Quiz : tentatives, durée limite côté serveur, correction, délai de 24 h (RG-40 à RG-42).
- Certificats PDF avec QR code (RG-33, RG-34), page publique de vérification.

## Phase 7 — Paiement et communauté

- Interface `PaymentProvider`, adaptateur `fake`, puis agrégateur choisi ; webhook signé et idempotent, réconciliation (RG-50, RG-51).
- Coupons (RG-52), prix figé (RG-53), reçus PDF, remboursements.
- Questions/réponses, avis (RG-54), notifications in-app et e-mail.

## Phase 8 — Administration et lancement

- Tableau de bord complet, gestion des apprenants, modération, journal d'audit, exports CSV.
- Dockerfiles et Compose de production (livrable §8.4), Nginx.
- Tests de charge (500 utilisateurs, 100 lectures vidéo), Lighthouse mobile ≥ 85, OWASP ZAP, sauvegardes et restauration.
- Recette selon §8.5, mise en production.

## Décisions à prendre

| Sujet | Échéance | Options |
| --- | --- | --- |
| Version de PostgreSQL | Phase 1 | Le cahier et `CLAUDE.md` indiquent 16 ; la machine de développement a la 18. Aligner la production sur la version retenue |
| Redis sans Docker (files BullMQ du worker uniquement) | Avant la phase 4 (publication programmée RG-12) | Memurai (Windows) ou Redis sous WSL. Sessions et RG-04 : **décidé**, PostgreSQL |
| Stockage objet sans Docker (MinIO) | **Avant la phase 4** (images collées F-34 et couverture exigée par RG-10 pour publier) | MinIO installé localement, Cloudflare R2, AWS S3, Wasabi |
| Envoi d'e-mails | Avant la phase 3 (vérification d'e-mail, mot de passe oublié) | Fournisseur SMTP (Brevo, Mailgun…) ; en local, Mailpit installé sans Docker |
| Agrégateur de paiement | Avant la phase 7 | CinetPay, PayDunya, Lengo Pay |
| Dépendances proposées | À la phase concernée | `arctic`, `otplib`, `rate-limiter-flexible`, `@asteasolutions/zod-to-openapi`, `@dnd-kit` (adoptés : `zod`, Prisma, Jest, Playwright en phase 1 ; `@node-rs/argon2`, `pino`, `tsx` en phase 2) |
| Photos (accueil, formateur, connexion) | Avant la mise en ligne | Fournies par Doztra ; emplacements prévus en attendant |
