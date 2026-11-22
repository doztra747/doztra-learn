---
name: doztra-learn-security
description: Utiliser pour toute partie de Doztra-Learn touchant authentification, sessions, rôles, CSRF, en-têtes HTTP, uploads, URL signées des médias, nettoyage HTML, limitation de débit, secrets, données personnelles, ou pour une revue de sécurité avant fusion.
---

# Doztra-Learn — sécurité

Référence : OWASP Top 10 (2021) et OWASP ASVS niveau 2. Chaque point ci-dessous est vérifiable dans le code ou par un test.

## Authentification

- Mots de passe : **Argon2id** (`argon2`, memoryCost ≥ 19 MiB, timeCost ≥ 2). Jamais bcrypt tronqué, jamais de hash maison.
- Connexion : message d'échec unique « E-mail ou mot de passe incorrect » ; même temps de réponse que l'e-mail existe ou non.
- Verrouillage RG-04 : compteurs en PostgreSQL (`login_attempts`, clés SHA-256) par e-mail et par IP (IP comptée seulement derrière un proxy de confiance).
- Jetons (vérification e-mail, réinitialisation) : 32 octets aléatoires (`crypto.randomBytes`), **stockés hachés** (SHA-256), usage unique, expiration (24 h vérification, 1 h réinitialisation). Une réinitialisation invalide toutes les sessions de l'utilisateur.
- Compte OWNER : TOTP obligatoire (`otplib`), codes de secours hachés ; création uniquement par CLI.
- Google OAuth : paramètre `state` **et** PKCE vérifiés (bibliothèque `arctic`, à valider comme nouvelle dépendance), e-mail `email_verified` exigé, liaison à un compte existant seulement après connexion par mot de passe. Callback = Route Handler `GET /api/auth/google/callback`, toujours dynamique.
- Pas de NextAuth/Auth.js ni de JWT de session sans accord : sessions côté serveur dans PostgreSQL (révocables ; décision du 22/11/2026, à la place de Redis).

## Sessions

- Module `src/server/auth/sessions.ts` (`server-only`) : jeton aléatoire de 32 octets dans le cookie, seul son SHA-256 est stocké (table `sessions`) ; cookie `__Host-dzl.sid`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, posé via `cookies()` de `next/headers` (uniquement dans une Server Action ou un Route Handler).
- Régénérer l'id de session à la connexion et à l'élévation (validation TOTP). Expiration glissante 7 j, « se souvenir de moi » 30 j.
- Déconnexion : session supprimée en base, pas seulement le cookie.
- `getSession()` est mémoïsé par requête avec `cache()` de React ; jamais avec `'use cache'` (données privées).

## Autorisation

- Couche d'accès aux données (DAL) `src/server/auth/dal.ts` : `getSession()`, `requireUser()` (redirige vers la connexion ou lève 401), `requireRole('OWNER')`, `requireRole('OWNER', 'ASSISTANT')`.
- **Chaque** page protégée, Server Action et Route Handler appelle la DAL lui-même. Un layout ne protège pas ses pages (il n'est pas réexécuté à chaque navigation) et une Server Action peut être appelée directement par POST : elle revérifie toujours.
- `proxy.ts` ne fait que des redirections optimistes (présence du cookie, `/studio` → connexion) ; il ne remplace jamais la DAL.
- Contrôle d'accès **objet par objet** dans les services (policies) : un id dans l'URL ne prouve rien. Ex. `learningService.assertCanAccessLesson(userId, lessonId)` avant tout contenu ou toute URL signée.
- Ne passer aux Client Components que des objets construits pour l'affichage (pas de modèle Prisma, pas de hash, pas de jeton) ; `experimental.taint` activé en filet de sécurité.
- Tests d'accès obligatoires pour chaque page, action et route (voir skill backend).

## CSRF et formulaires

- Server Actions : POST uniquement et comparaison `Origin`/`Host` faites par Next.js. Derrière Nginx, transmettre `X-Forwarded-Host` correctement ; ne renseigner `serverActions.allowedOrigins` qu'avec le domaine de production. Une requête sans en-tête `Origin` passe avec un simple avertissement : le cookie `SameSite=Lax` reste indispensable.
- Route Handlers qui modifient des données (POST/PUT/PATCH/DELETE) avec la session cookie : vérifier soi-même que `Origin` correspond à `APP_URL` (utilitaire `assertSameOrigin(request)`), et refuser sinon (403).
- Aucune mutation dans un `GET` (pages ou Route Handlers).
- Webhooks de paiement exclus de ce contrôle mais protégés par signature (voir payments).

## En-têtes et transport

- CSP à nonce générée dans `proxy.ts` (guide `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`) :
  `default-src 'self'; script-src 'self' 'nonce-{n}' 'strict-dynamic'; style-src 'self' 'nonce-{n}'; img-src 'self' data: blob: {CDN}; media-src 'self' blob: {CDN}; font-src 'self'; connect-src 'self' {S3_UPLOAD_HOST}; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`.
  `'unsafe-eval'` seulement en développement (exigé par React). La nonce rend les pages dynamiques : c'est un choix assumé ; signaler tout besoin de page statique plutôt que d'affaiblir la CSP.
- Autres en-têtes (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`) via `headers()` dans `next.config.ts` ; `poweredByHeader: false`.
- Pas d'attribut `style` ni de gestionnaire `on*` dans le HTML généré côté serveur (contenu des leçons) ; les composants React utilisent les classes Tailwind.
- Font Awesome (SVG) : `config.autoAddCss = false` et import de `@fortawesome/fontawesome-svg-core/styles.css`, pour ne pas injecter de `<style>` sans nonce.
- HSTS 1 an + `includeSubDomains` ; TLS 1.2+ ; redirection HTTP→HTTPS par Nginx.
- IP réelle derrière Nginx : lire `X-Forwarded-For` seulement si la requête vient du proxy de confiance (une seule valeur, posée par Nginx).

## Limitation de débit

Compteurs (PostgreSQL pour la connexion, déjà en place ; pour le reste, `rate-limiter-flexible` à valider) appelés au début de la Server Action ou du Route Handler concerné (pas dans `proxy.ts`) : connexion 10/min/IP, inscription 5/h/IP, mot de passe oublié 3/h/e-mail, questions/avis 20/h/utilisateur, API générale 120/min/utilisateur, signature d'URL média 60/min/utilisateur.

## Contenu utilisateur (XSS)

- Le contenu Tiptap est validé par schéma puis rendu en HTML **côté serveur**, puis nettoyé par `sanitize-html` (liste blanche de balises, attributs et classes ; voir `doztra-learn-rich-content`).
- React échappe tout par défaut ; `dangerouslySetInnerHTML` réservé au HTML déjà nettoyé et stocké (`content_html`), jamais à une saisie brute. Pas de `href` construit depuis une saisie sans contrôle du protocole (`javascript:`).
- Liens : `rel="noopener noreferrer nofollow"` et protocoles `http`, `https`, `mailto` seulement.
- Questions/réponses et avis : texte ou sous-ensemble Tiptap (code, gras, liens, images importées) avec le même nettoyage.

## Uploads

- Upload direct navigateur → S3 par URL présignée (jamais via une Server Action ni le corps d'un Route Handler) ; dans les deux cas : taille annoncée vérifiée avant, taille réelle et type réel (magic bytes, `file-type`) vérifiés après, avant tout traitement (RG-20, RG-21).
- Clés de stockage générées par le serveur (`<kind>/<uuid>/<variant>`), jamais le nom fourni par le client ; nom d'origine conservé en base seulement, échappé à l'affichage.
- Images : ré-encodées par `sharp` (supprime EXIF/GPS et charges cachées), limite 40 Mpx.
- SVG refusé à l'import (ou converti en PNG). PDF servi avec `Content-Disposition` contrôlé et `Content-Type: application/pdf`.
- FFmpeg/pdftoppm exécutés par `execFile`/`spawn` avec arguments en tableau, jamais via un shell ; protocoles FFmpeg limités (`-protocol_whitelist file`), délai maximal et limites mémoire/CPU du conteneur worker.
- Bucket **privé** ; aucune ACL publique.

## URL signées

- Lecture HLS : la playlist maître et les segments sont servis via URL signées (CDN signed cookies ou URL S3 présignées), durée 2 h, émises après `assertCanAccessLesson`.
- PDF et ressources : URL présignée 5 min, `response-content-disposition=attachment` seulement si `allow_download`.
- Ne jamais mettre en cache public une réponse contenant une URL signée : pas de `'use cache'`, réponse `Cache-Control: private, no-store`.

## Secrets et données personnelles

- Secrets en variables d'environnement (ou gestionnaire de secrets) ; `.env*` dans `.gitignore` ; scan de secrets en CI (gitleaks).
- Aucun secret préfixé `NEXT_PUBLIC_` (ces variables sont copiées dans le bundle navigateur). Tout module qui lit un secret commence par `import 'server-only'`.
- Données personnelles minimales ; export et suppression (anonymisation) du compte (F-07) ; consentement e-mails marketing séparé.
- Journal d'audit pour les actions OWNER sensibles (remboursement, accès offert, blocage, changement de paramètres de paiement).
- Logs : jamais de mot de passe, jeton, cookie, numéro de téléphone complet ni payload de paiement brut.

## Dépendances et CI

- `npm audit --omit=dev` et Dependabot/Renovate ; build en échec sur vulnérabilité haute ou critique.
- Images Docker minimales (`node:22-alpine` ou distroless, sortie `output: 'standalone'`), utilisateur non root, système de fichiers en lecture seule pour l'app Next.js.
- Scan OWASP ZAP baseline sur l'environnement de recette avant mise en production.

## Checklist de revue

- [ ] Toute nouvelle page, Server Action ou Route Handler : appel de la DAL, rôle, contrôle objet, schéma zod avec limites, test d'accès.
- [ ] Aucune donnée utilisateur passée à `dangerouslySetInnerHTML` sans nettoyage.
- [ ] Aucun `'use cache'` sur une donnée privée ; aucun objet sensible passé à un Client Component.
- [ ] Aucun fichier privé atteignable sans URL signée.
- [ ] Aucune commande système construite par concaténation.
- [ ] Aucun secret ni donnée personnelle dans le code, les logs, les erreurs.
- [ ] Opérations d'argent et de certificats idempotentes et transactionnelles.
