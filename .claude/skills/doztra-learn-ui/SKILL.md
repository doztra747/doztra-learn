---
name: doztra-learn-ui
description: Utiliser pour implémenter ou relire l'interface de Doztra-Learn en Next.js 16 (App Router, React 19) + Tailwind CSS 4 + Font Awesome Classic — jetons de design du prototype, composants, inventaire des 24 écrans, espace formateur, responsive et accessibilité.
---

# Doztra-Learn — interface

Le rendu visuel de référence est le prototype : `docs/prototype/Doztra-Learn.dc.html` (site apprenant) et `docs/prototype/Doztra-Learn Admin.dc.html` (espace formateur). Ouvrir l'écran concerné avant de coder et reproduire couleurs, rayons, espacements et icônes. Le prototype utilise des styles inline : les **traduire en classes Tailwind** basées sur les jetons ci-dessous, jamais copier les `style=""`.

## Jetons de design

Palette de marque : Deep Forest, Golden Hour, Terracotta Clay, Warm Sand. Configuration complète (Tailwind 4, bloc `@theme` à reprendre dans `src/app/globals.css`) : `references/theme.css`. Les noms de jetons ci-dessous deviennent des utilitaires (`bg-forest`, `text-ink-700`, `border-line-admin`…).

| Jeton Tailwind | Hex | Usage |
| --- | --- | --- |
| `forest` | `#0F3D3A` | Couleur principale : logo, titres, boutons primaires, en-tête des blocs de code |
| `forest-900` | `#0A2C2A` | Fond du lecteur vidéo, sections sombres |
| `code-bg` | `#0B2725` | Fond des blocs de code |
| `gold` | `#F4B13B` | Accent : focus, avatar, mots-clés du code, badges |
| `terracotta` | `#E0745E` | Accent secondaire : tiret du logo, pastille de notification, icônes vidéo |
| `terracotta-700` | `#B9533F` | Survol des liens |
| `sand` | `#F2E6D6` | Fonds doux, texte clair sur fond sombre |
| `cream` | `#FAF6F0` | Fond de page (site apprenant) |
| `paper` | `#FBF8F3` | Fond de page (espace formateur), cartes secondaires |
| `ink` | `#142422` | Texte principal |
| `ink-700` | `#3D4F4C` | Texte de paragraphe |
| `muted` | `#5B6B68` | Texte secondaire, libellés |
| `subtle` | `#8A9794` | Texte tertiaire, placeholders |
| `line` | `#EAE2D6` | Bordures (site) |
| `line-admin` | `#E6DED2` | Bordures (espace formateur) |
| `success` / `success-bg` | `#1F7A5C` / `#E6F3EE` | Terminé, payé, publié |
| `warning` / `warning-bg` | `#7A4E00` / `#FDF1DA` | En cours, en attente, brouillon |
| `danger` / `danger-bg` | `#8A3A2A` / `#FBE6E1` | Échec, refus, suppression |
| `mint` | `#E3ECEA` | Fonds d'icônes, puces neutres |
| `inline-code` | `#F3EDE3` | Fond du code en ligne |

Typographie : **Plus Jakarta Sans** 400/500/600/700/800 (UI), **JetBrains Mono** 400/500 (code, durées), chargées par `next/font/google` dans `src/app/layout.tsx` (fichiers auto-hébergés au build) et exposées en variables `--font-jakarta` / `--font-jetbrains` reprises par `@theme`. Tailles utilisées : 12, 13, 14, 15, 16, 18, 22, 26 px ; titre d'accueil `clamp(…, 46px)`. Titres en 800, `tracking-tight` (−0,02em).

Rayons : 9 px (petits boutons), 12 px (champs, boutons, cartes compactes), 14–16 px (blocs de code, cartes), 20–22 px (grandes cartes, lecteur), `full` (pastilles, avatars, navigation). Ombre carte : `0 18px 40px -24px rgba(15,61,58,.45)`.

Focus : `outline 2px gold, offset 1px` sur **tout** élément interactif (jamais `outline: none` sans remplacement).

Conteneur : `max-w-[1200px] mx-auto px-5` ; texte de lecture `max-w-[720px]`. Grilles `repeat(auto-fill,minmax(250–300px,1fr))` pour les cartes de cours.

## Icônes — Font Awesome 6 Classic

- Uniquement Solid et Regular, via `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/free-regular-svg-icons` et `@fortawesome/react-fontawesome` (SVG, importés icône par icône, sans CDN ; le prototype charge un CDN : ne pas le reproduire). Pas de `free-brands-svg-icons`.
- Dans `layout.tsx` : `config.autoAddCss = false` + `import '@fortawesome/fontawesome-svg-core/styles.css'` (compatibilité CSP).
- Le tableau donne les classes du prototype ; en React, `fa-solid fa-circle-play` devient `<FontAwesomeIcon icon={faCirclePlay} />` importé de `free-solid-svg-icons`, et `fa-regular fa-file-lines` devient `faFileLines` importé de `free-regular-svg-icons`. Respecter le style (Solid/Regular) indiqué. Un composant `<Icon>` maison centralise `aria-hidden` / `aria-label`. Animation de chargement : prop `spin`.
- Icône décorative : `aria-hidden="true"`. Bouton icône seul : `aria-label` en français.
- Correspondances fixes (ne pas en inventer d'autres pour le même sens) :

| Sens | Classe |
| --- | --- |
| Logo | `fa-solid fa-graduation-cap` (or sur carré forest) |
| Leçon vidéo / lecture | `fa-solid fa-circle-play` · `fa-solid fa-play` |
| Leçon texte | `fa-regular fa-file-lines` |
| Leçon PDF | `fa-regular fa-file-pdf` |
| Quiz | `fa-solid fa-list-check` |
| Code / fichier de code | `fa-solid fa-code` · `fa-solid fa-terminal` |
| Copier / copié | `fa-regular fa-copy` → `fa-solid fa-check` |
| Image | `fa-regular fa-image` |
| Télécharger / importer | `fa-solid fa-download` · `fa-solid fa-cloud-arrow-up` |
| Terminé / en cours / à faire | `fa-solid fa-circle-check` · `fa-solid fa-circle-dot` · `fa-regular fa-circle` |
| Verrouillé | `fa-solid fa-lock` |
| Certificat | `fa-solid fa-award` |
| Note | `fa-solid fa-star` / `fa-regular fa-star` |
| Favori | `fa-solid fa-heart` / `fa-regular fa-heart` |
| Questions | `fa-regular fa-comments` · répondre `fa-solid fa-reply` |
| Notifications | `fa-regular fa-bell` |
| Recherche | `fa-solid fa-magnifying-glass` |
| Mobile Money / carte | `fa-solid fa-mobile-screen-button` · `fa-regular fa-credit-card` |
| Sous-titres | `fa-regular fa-closed-captioning` |
| Durée / date | `fa-regular fa-clock` · `fa-regular fa-calendar` |
| Encadrés Info / Astuce / Attention / Important | `fa-solid fa-circle-info` · `fa-regular fa-lightbulb` · `fa-solid fa-triangle-exclamation` · `fa-solid fa-circle-exclamation` |
| Glisser | `fa-solid fa-grip-vertical` |
| Tableau de bord / statistiques | `fa-solid fa-chart-line` · `fa-solid fa-chart-simple` |
| Apprenants | `fa-solid fa-users` · `fa-solid fa-user-graduate` |
| Cours / sections | `fa-solid fa-book-open` · `fa-solid fa-layer-group` |
| Archiver | `fa-solid fa-box-archive` |
| Menu / fermer / plus d'actions | `fa-solid fa-bars` · `fa-solid fa-xmark` · `fa-solid fa-ellipsis-vertical` |
| Chargement | `fa-solid fa-spinner fa-spin` (avec `aria-live`) |

## Inventaire des écrans (24)

| Espace | Écran | Route App Router (`src/app/…/page.tsx`) | Prototype |
| --- | --- | --- | --- |
| Public | Accueil | `(site)/page` | `home` |
| Public | Catalogue et recherche | `(site)/courses` | `catalog` |
| Public | Fiche cours | `(site)/courses/[slug]` | `course` |
| Public | À propos du formateur | `(site)/about` | section formateur de `home` |
| Public | Vérification de certificat | `(site)/certificates/[code]` | — (suivre le style `course`) |
| Public | Connexion / inscription | `(site)/login`, `(site)/register` | `auth` |
| Public | Mot de passe oublié | `(site)/forgot-password` | style `auth` |
| Apprenant | Mes cours | `(learn)/my-courses` | `mine` (onglet liste) |
| Apprenant | Lecteur de cours (texte, vidéo, PDF) | `(learn)/learn/[courseSlug]/[lessonId]` | `player` |
| Apprenant | Quiz et résultat | composant du lecteur | `player` (état quiz) |
| Apprenant | Mes certificats | `(learn)/my-certificates` | `mine` (onglet certificats) |
| Apprenant | Paiement et confirmation | modale + `(learn)/checkout/[orderId]` | modale de paiement (Orange Money, carte, coupon, attente, confirmé) |
| Apprenant | Historique des achats | `(learn)/account/orders` | — |
| Apprenant | Profil et paramètres | `(learn)/account/profile` | — |
| Formateur | Tableau de bord | `studio/page` | `dash` |
| Formateur | Mes cours | `studio/courses` | `courses` |
| Formateur | Éditeur de cours (onglets Infos, Programme, Prix, Publication) | `studio/courses/[id]` (onglets en segments enfants) | `editor` + `infos`/`programme`/`prix`/`publication` |
| Formateur | Éditeur de leçon textuelle | `studio/courses/[id]/lessons/[lessonId]` | — (voir `doztra-learn-rich-content`) |
| Formateur | Import vidéo et miniature | `studio/media/upload` | `video` |
| Formateur | Éditeur de quiz | `studio/courses/[id]/quizzes/[quizId]` | — |
| Formateur | Questions et avis | `studio/questions` | `questions` |
| Formateur | Apprenants | `studio/students` | `students` |
| Formateur | Paiements, remboursements et coupons | `studio/payments`, `studio/coupons` | `payments`/`orders`, `coupons` |
| Formateur | Catégories, modération, paramètres du site | `studio/settings` | — |

Les chemins sont une proposition : s'aligner sur le cahier des charges s'il en fixe, et garder les URL publiques stables (slugs, redirections 301). Chaque segment a son `loading.tsx` (squelette) si les données sont lentes ; `not-found.tsx` et `error.tsx` en français.

Navigation de l'espace formateur (`studio/layout.tsx`, barre latérale ~268 px, repliée en tiroir sous 1024 px) groupée comme le prototype : **Pilotage** (Tableau de bord), **Contenus** (Cours, Médias), **Communauté** (Questions et avis, Apprenants), **Ventes** (Paiements, Coupons). Indicateurs du tableau de bord : Apprenants inscrits, Revenus du mois, Taux de complétion, Questions sans réponse ; puis Revenus, Abandons par leçon, Cours les plus suivis, Questions sans réponse.

## Composants React

`src/components/` (Server Components par défaut, `'use client'` seulement si nécessaire) : `header`, `footer`, `studio-sidebar`, `button` (variantes `primary` forest, `accent` gold, `ghost`, `danger`), `badge` (statuts : `success`/`warning`/`danger`/`neutral`), `course-card`, `lesson-row` (icône du type + état + durée), `progress-bar`, `rating`, `empty-state`, `toast`, `modal`, `tabs`, `pagination`, `form-field` (libellé, aide, erreur liée par `aria-describedby`), `callout`, `code-block`, `stat-card`, `data-table`.

Un composant = un fichier + ses classes Tailwind ; variantes par props typées (`variant: 'primary' | 'accent' | 'ghost' | 'danger'`), pas de variantes ad hoc dans les pages. Liens internes avec `next/link`, images avec `next/image` (domaine du CDN déclaré dans `images.remotePatterns`).

## Interactivité

- **Server Components** par défaut ; frontière `'use client'` placée le plus bas possible (un bouton, un menu), pas sur une page entière.
- **Formulaires** : Server Actions + `useActionState` (erreurs par champ, message global) + `useFormStatus` (bouton désactivé et spinner pendant l'envoi). Fonctionnent sans JS.
- **Filtres du catalogue** : état dans l'URL (`searchParams`), navigation par `next/link` / `router.replace` ; pas d'état client dupliqué.
- **Mises à jour optimistes** (réordonnancement, favoris, Q&R) : `useOptimistic`, puis `revalidatePath`/`revalidateTag` côté serveur.
- **Interrogation périodique** (statut de transcodage, paiement Mobile Money) : Client Component avec `setInterval` sur un Route Handler, arrêtée à l'état final et au démontage.
- **État local** (menus, onglets, modales, copier le code) : `useState` dans de petits Client Components ; modales en `<dialog>` natif avec piège du focus.
- **Composants lourds** : éditeur Tiptap, lecteur Video.js + hls.js, visionneuse PDF.js, glisser-déposer (`@dnd-kit` plutôt que SortableJS en React, à valider) via `next/dynamic` dans un Client Component, chargés uniquement sur leurs pages.
- Chaque action asynchrone a un état de chargement, de succès et d'erreur visible (toast `role="status"` ou `role="alert"`).

## Responsive

Mobile first, testé à 360, 768, 1024, 1440 px. Lecteur de cours : programme en tiroir sur mobile, barre latérale à partir de 1024 px. Tableaux du studio : vue cartes sous 768 px. Cibles tactiles ≥ 40 px (le prototype utilise 40–42 px).

## Accessibilité (WCAG 2.1 AA)

- Contrastes : `muted` sur `cream` est la limite basse ; ne pas éclaircir davantage le texte. Texte sur `gold` toujours en `forest`.
- Structure : un `h1` par page, ordre des titres respecté, `main`/`nav`/`aside` landmarks, lien « Aller au contenu ».
- Formulaires : `label` associés, erreurs annoncées, pas d'information portée par la couleur seule (statuts = couleur + icône + texte).
- Vidéo : sous-titres, commandes clavier ; modale : piège du focus et retour du focus à la fermeture.
- `<html lang="fr">` dans `src/app/layout.tsx`, dates `JJ/MM/AAAA`, montants `12 500 GNF` (`Intl.NumberFormat('fr-GN')`).
