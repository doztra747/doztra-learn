# Cahier des charges — Doztra-Learn

Nov 22, 2026 · @Ibrahima Bayo

Doztra-Learn est une plateforme e-learning full stack (Next.js + PostgreSQL) qui permet de publier des cours riches — texte mis en forme, code coloré, captures d'écran, vidéos avec miniature et PDF — et de suivre la progression des apprenants. Ce document fixe le périmètre de la version 1.0 (MVP) et sert de référence au développement, aux tests et à la recette.

## 1. Présentation du projet

### 1.1 Informations du document

| Élément | Valeur |
| --- | --- |
| Projet | Doztra-Learn — plateforme e-learning |
| Porteur | Doztra SARL |
| Contact | bayo.ibrahima@doztra.com · +224 623 04 47 82 |
| Version du document | 1.1 (22/11/2026 : passage de NestJS à Next.js) |
| Stack imposée | Next.js 16 (full stack), PostgreSQL, Font Awesome Classic |
| Version visée | MVP 1.0 |

### 1.2 Contexte

Les formations au numérique en Afrique de l'Ouest reposent encore souvent sur des supports dispersés : PDF envoyés par messagerie, vidéos sur YouTube, code partagé en capture d'écran. L'apprenant ne sait pas où il en est, et le formateur ne voit pas qui progresse. Doztra-Learn réunit tout le contenu d'un cours au même endroit, avec une mise en forme soignée et un suivi de progression.

### 1.3 Objectifs

1. **Publier facilement des cours de qualité** : un éditeur riche qui gère titres, listes, tableaux, images, captures d'écran et blocs de code avec coloration syntaxique.
2. **Rendre les explications plus claires grâce à la vidéo** : import de vidéos avec miniature, lecture fluide en streaming adaptatif, même avec une connexion moyenne.
3. **Réutiliser les supports existants** : import de PDF consultables en ligne et téléchargeables.
4. **Suivre l'apprentissage** : progression par leçon, quiz, certificat de fin de cours.
5. **Préparer la monétisation** : cours gratuits ou payants, paiement Mobile Money et carte (Orange Money, MTN MoMo, carte bancaire).

### 1.4 Indicateurs de réussite (6 mois après la mise en ligne)

| Indicateur | Cible |
| --- | --- |
| Cours publiés | ≥ 30 |
| Apprenants inscrits | ≥ 1 000 |
| Taux de complétion moyen d'un cours | ≥ 35 % |
| Temps de démarrage d'une vidéo (connexion 4G) | < 3 s |
| Disponibilité du service | ≥ 99,5 % |

Ces cibles sont des propositions à valider par le porteur du projet.

## 2. Périmètre et acteurs

Le MVP couvre la création et la publication de cours, la consultation par les apprenants, le suivi de progression, les quiz, les certificats et le paiement en ligne. Les fonctions sociales avancées et l'application mobile native viennent après.

### 2.1 Dans le périmètre (MVP 1.0)

- Authentification et gestion des comptes (e-mail + mot de passe, Google en option)
- Catalogue public des cours, recherche et filtres
- Création de cours structurés en sections et leçons
- Leçons textuelles riches : mise en forme, images, captures d'écran, blocs de code colorés
- Leçons vidéo : import, transcodage, miniature, lecteur avec reprise
- Leçons PDF : import, visionneuse intégrée, téléchargement optionnel
- Ressources jointes à une leçon (fichiers sources, archives)
- Inscription à un cours, progression, reprise là où on s'est arrêté
- Quiz de fin de section ou de cours
- Certificat PDF de fin de cours avec code de vérification
- Cours gratuits et payants, paiement Mobile Money et carte, coupons de réduction
- Questions/réponses sous chaque leçon, avis et notes sur les cours
- Notifications in-app et par e-mail
- Espace d'administration unique pour le formateur, propriétaire de la plateforme

### 2.2 Hors périmètre (versions suivantes)

- Application mobile native (Android/iOS)
- Cours en direct (classes virtuelles)
- Téléchargement hors ligne des vidéos
- Ouverture à d'autres formateurs (place de marché) et reversement de revenus
- Exercices de code exécutables dans le navigateur
- Multilingue (la V1 est en français)

### 2.3 Acteurs et rôles

| Rôle | Qui | Peut faire |
| --- | --- | --- |
| Visiteur | Personne non connectée | Parcourir le catalogue, voir la fiche d'un cours et les leçons marquées « aperçu gratuit », créer un compte |
| Apprenant | Utilisateur inscrit | S'inscrire à un cours, suivre les leçons, passer les quiz, poser des questions, noter un cours, obtenir ses certificats |
| Formateur (propriétaire) | Un seul compte : le propriétaire de Doztra-Learn | Créer et publier tous les cours, importer vidéos et PDF, répondre aux questions, gérer apprenants, paiements, coupons, catégories, modération et paramètres, voir toutes les statistiques |
| Assistant (optionnel) | Personne de confiance désignée par le formateur | Répondre aux questions et modérer les commentaires ; aucun accès aux cours en édition, aux paiements ni aux paramètres |

Doztra-Learn est une plateforme à formateur unique : tous les cours sont créés et publiés par le propriétaire. Il n'y a ni inscription de formateurs, ni validation des cours par un tiers, ni partage de revenus.

## 3. Spécifications fonctionnelles

Les fonctions sont regroupées en 10 modules. Chaque exigence porte un identifiant (F-xx) repris dans les tests de recette. Priorité : **M** = indispensable au MVP, **S** = souhaitable au MVP, **C** = confort, peut glisser.

### 3.1 Module Authentification et comptes (AUTH)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-01 | Inscription par e-mail + mot de passe, avec vérification de l'e-mail par lien à usage unique | M |
| F-02 | Connexion, déconnexion, « se souvenir de moi » (session 30 jours) | M |
| F-03 | Mot de passe oublié : lien de réinitialisation valable 1 h | M |
| F-04 | Connexion avec Google (OAuth 2.0) | S |
| F-05 | Profil : photo, nom, bio, lien LinkedIn/GitHub, téléphone | M |
| F-06 | Compte formateur unique créé à l'installation (commande en ligne de commande), avec double authentification (TOTP) obligatoire | M |
| F-07 | Suppression du compte par l'utilisateur (anonymisation des données) | S |

### 3.2 Module Catalogue et découverte (CAT)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-10 | Page d'accueil : cours mis en avant, nouveautés, catégories populaires | M |
| F-11 | Catalogue paginé avec filtres : catégorie, niveau (débutant, intermédiaire, avancé), prix (gratuit/payant), durée, note | M |
| F-12 | Recherche plein texte sur titre, description, tags et contenu des leçons textuelles (tolérante aux accents) | M |
| F-13 | Fiche cours : titre, sous-titre, vidéo de présentation, objectifs, prérequis, programme (sections/leçons et durées), formateur, avis, prix | M |
| F-14 | Leçons « aperçu gratuit » consultables sans inscription | S |
| F-15 | Liste de souhaits (favoris) | C |

### 3.3 Module Création de cours (COURS)

Un cours se compose de **sections** ordonnées, elles-mêmes composées de **leçons** ordonnées. Une leçon est de type Texte, Vidéo, PDF ou Quiz.

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-20 | Créer un cours : titre, slug auto-généré, sous-titre, description riche, catégorie, tags, niveau, langue, image de couverture, objectifs, prérequis, prix | M |
| F-21 | Créer, renommer, supprimer et réordonner sections et leçons par glisser-déposer | M |
| F-22 | Brouillon automatique toutes les 10 s pendant l'édition | M |
| F-23 | Prévisualiser le cours comme un apprenant avant publication | M |
| F-24 | Cycle de publication : Brouillon → Publié (immédiatement ou à une date programmée) → Archivé (voir règles RG-10 à RG-13) | M |
| F-25 | Dupliquer un cours ou une leçon | C |
| F-26 | Historique des versions d'une leçon textuelle (10 dernières) avec restauration | S |

### 3.4 Module Leçon textuelle et éditeur riche (EDIT)

L'éditeur est un éditeur par blocs (type Notion) stockant le contenu en JSON structuré, rendu côté serveur en HTML sécurisé.

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-30 | Mise en forme : titres H2-H4, gras, italique, souligné, barré, code en ligne, liens, couleurs de surlignage | M |
| F-31 | Listes à puces, numérotées, cases à cocher ; citations ; séparateurs | M |
| F-32 | Tableaux (ajout/suppression de lignes et colonnes) | M |
| F-33 | **Blocs de code** : choix du langage (au moins JavaScript, TypeScript, Python, PHP, Java, C, C++, C#, SQL, HTML, CSS, Bash, JSON, YAML, Dart, Kotlin), coloration syntaxique, numéros de ligne, nom de fichier optionnel, bouton « Copier », mise en évidence de lignes | M |
| F-34 | **Images et captures d'écran** : import par glisser-déposer, collage direct depuis le presse-papiers (Ctrl+V), légende, texte alternatif, zoom au clic (lightbox) | M |
| F-35 | Encadrés pédagogiques : Info, Astuce, Attention, Important (icône Font Awesome + couleur) | M |
| F-36 | Intégration d'une vidéo ou d'un PDF de la bibliothèque à l'intérieur d'une leçon textuelle | S |
| F-37 | Formules mathématiques (LaTeX via KaTeX) | C |
| F-38 | Import d'un fichier Markdown (.md) converti en blocs | S |
| F-39 | Sommaire automatique de la leçon à partir des titres, temps de lecture estimé | S |

### 3.5 Module Vidéo (VID)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-40 | Import de vidéos MP4, MOV, WEBM, MKV jusqu'à 2 Go par fichier, en upload fractionné et reprenable (protocole tus ou multipart S3) avec barre de progression | M |
| F-41 | Transcodage automatique en arrière-plan (FFmpeg) vers HLS en 360p, 720p et 1080p (selon la source) | M |
| F-42 | **Miniature** : génération automatique de 3 propositions (à 10 %, 50 %, 90 % de la durée) + possibilité d'importer une miniature personnalisée (JPG/PNG/WEBP, 1280×720 recommandé) | M |
| F-43 | Statut de traitement visible : En file, En cours (%), Prête, Échec (avec motif et relance) | M |
| F-44 | Lecteur : qualité adaptative automatique ou manuelle, vitesse 0,5× à 2×, plein écran, raccourcis clavier, reprise à la dernière position | M |
| F-45 | Sous-titres WebVTT importables par le formateur | S |
| F-46 | Chapitres (marqueurs temporels cliquables) | C |
| F-47 | Protection : URL de lecture signées et expirant après 2 h, filigrane avec l'e-mail de l'apprenant | S |
| F-48 | Durée de la vidéo calculée automatiquement et reportée sur la durée du cours | M |

### 3.6 Module PDF et ressources (PDF)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-50 | Import de PDF jusqu'à 100 Mo | M |
| F-51 | Visionneuse intégrée (PDF.js) : pagination, zoom, plein écran, recherche dans le document | M |
| F-52 | Miniature de la première page générée automatiquement | M |
| F-53 | Le formateur autorise ou non le téléchargement du PDF | M |
| F-54 | Ressources jointes à une leçon : ZIP, code source, PPTX, DOCX, XLSX, images (50 Mo max par fichier) | M |
| F-55 | Conversion optionnelle d'un PDF en leçon textuelle éditable (extraction du texte) | C |

### 3.7 Module Apprentissage et progression (APP)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-60 | S'inscrire à un cours gratuit en un clic ; accès à un cours payant après paiement confirmé | M |
| F-61 | Lecteur de cours : programme en barre latérale, leçon suivante/précédente, mode concentration | M |
| F-62 | Leçon marquée terminée : automatiquement (vidéo vue à 90 %, texte défilé jusqu'en bas, quiz réussi) ou manuellement | M |
| F-63 | Barre de progression par cours (%) et reprise à la dernière leçon | M |
| F-64 | Espace « Mes cours » : en cours, terminés, certificats | M |
| F-65 | Notes personnelles horodatées sur une leçon ou une vidéo | S |

### 3.8 Module Quiz et certificats (EVAL)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-70 | Types de question : choix unique, choix multiples, vrai/faux, réponse courte ; question pouvant contenir du code coloré | M |
| F-71 | Paramètres d'un quiz : score minimum (défaut 70 %), nombre de tentatives, durée limite optionnelle, ordre aléatoire | M |
| F-72 | Correction immédiate avec explication par question | M |
| F-73 | Certificat PDF généré à la fin du cours : nom, cours, date, durée, formateur, code unique et QR code | M |
| F-74 | Page publique de vérification d'un certificat par son code | M |

### 3.9 Module Paiement (PAY)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-80 | Prix en GNF (devise par défaut), prix barré optionnel | M |
| F-81 | Paiement Orange Money et MTN MoMo via un agrégateur (ex. CinetPay, PayDunya ou Lengo Pay) + carte bancaire | M |
| F-82 | Confirmation par webhook signé et idempotent ; accès ouvert seulement après confirmation | M |
| F-83 | Coupons : pourcentage ou montant fixe, date d'expiration, nombre d'utilisations max, cours ciblés | S |
| F-84 | Reçu PDF envoyé par e-mail, historique des achats | M |
| F-85 | Remboursement déclenché par l'admin (statut, motif) | S |

### 3.10 Module Interaction, notifications et administration (ADM)

| ID | Exigence | Priorité |
| --- | --- | --- |
| F-90 | Questions/réponses sous chaque leçon, avec code coloré et captures autorisés ; réponse du formateur mise en avant | M |
| F-91 | Avis : note de 1 à 5 étoiles + commentaire, réponse du formateur | M |
| F-92 | Notifications in-app (cloche) et e-mail : inscription, nouvelle réponse, cours publié/refusé, paiement, certificat | M |
| F-93 | Tableau de bord unique : inscrits, ventes et revenus, taux de complétion, abandons par leçon, notes, questions sans réponse, stockage utilisé | M |
| F-94 | Gestion des apprenants : liste, fiche (cours, progression, achats), accès offert manuellement à un cours, blocage | M |
| F-95 | Gestion des catégories (arborescence à 2 niveaux) et des tags | M |
| F-96 | Modération : signaler un commentaire, masquer, bannir un utilisateur | S |
| F-97 | Journal d'audit des actions admin | S |
| F-98 | Export CSV des inscrits et des ventes | S |

## 4. Règles de gestion

Ces 28 règles sont vérifiées côté serveur (services de `src/server/`), jamais seulement dans l'interface.

| ID | Règle |
| --- | --- |
| **Comptes** |  |
| RG-01 | L'e-mail est unique sur la plateforme (insensible à la casse). |
| RG-02 | Mot de passe : 8 caractères minimum, au moins une lettre et un chiffre ; stocké haché avec Argon2id. |
| RG-03 | Un compte non vérifié peut se connecter mais ne peut ni acheter ni s'inscrire à un cours. |
| RG-04 | 5 échecs de connexion en 15 min bloquent le compte 15 min. |
| RG-05 | Il n'existe qu'un seul compte Formateur ; aucun autre compte ne peut obtenir ce rôle depuis l'interface. Seul le formateur désigne ou retire un Assistant. |
| **Cours et leçons** |  |
| RG-10 | Un cours ne peut être publié que s'il a : titre, description, image de couverture, catégorie, au moins 1 section et 3 leçons publiables. |
| RG-11 | Une leçon vidéo n'est publiable que si son transcodage est « Prête » et qu'elle a une miniature. |
| RG-12 | Le formateur publie ses cours lui-même, sans validation par un tiers ; une publication programmée part automatiquement à la date et l'heure choisies. |
| RG-13 | Modifier un cours publié crée une nouvelle version en brouillon ; les apprenants voient la version publiée jusqu'à la republication. |
| RG-14 | Un cours ayant au moins un inscrit ne peut pas être supprimé, seulement archivé ; les inscrits gardent leur accès. |
| RG-15 | La durée d'un cours = somme des durées vidéo + temps de lecture estimé des leçons textuelles (200 mots/min). |
| RG-16 | Le slug d'un cours est unique ; en cas de doublon, un suffixe numérique est ajouté. |
| **Fichiers** |  |
| RG-20 | Le type réel d'un fichier est contrôlé par sa signature (magic bytes), pas seulement par son extension. |
| RG-21 | Limites : vidéo 2 Go, PDF 100 Mo, image 10 Mo, ressource 50 Mo. Alerte au formateur quand le stockage atteint 80 % de la capacité souscrite. |
| RG-22 | Un fichier supprimé d'une leçon est conservé 30 jours dans une corbeille puis effacé du stockage. |
| **Apprentissage** |  |
| RG-30 | L'accès à une leçon (hors aperçu gratuit) exige une inscription active au cours. |
| RG-31 | Une leçon vidéo est terminée quand 90 % de sa durée a été vue ; la position est enregistrée toutes les 15 s. |
| RG-32 | Progression d'un cours = leçons terminées / leçons publiées × 100, arrondie à l'entier. |
| RG-33 | Le certificat est émis quand la progression atteint 100 % et que tous les quiz obligatoires sont réussis. Il n'est émis qu'une fois par apprenant et par cours. |
| RG-34 | Le nom imprimé sur le certificat est figé à l'émission ; l'apprenant le confirme avant génération. |
| **Quiz** |  |
| RG-40 | Score = points obtenus / points possibles ; quiz réussi si score ≥ score minimum. |
| RG-41 | Au-delà du nombre de tentatives autorisées, un délai de 24 h s'applique avant une nouvelle série. |
| RG-42 | Avec une durée limite, le serveur fait foi : une réponse envoyée après l'expiration est refusée. |
| **Paiement et avis** |  |
| RG-50 | L'accès à un cours payant n'est ouvert qu'après confirmation du paiement par webhook vérifié ; le retour navigateur seul ne suffit pas. |
| RG-51 | Un même webhook reçu plusieurs fois ne crée qu'une seule inscription (clé d'idempotence = référence de transaction). |
| RG-52 | Un coupon expiré, épuisé ou hors périmètre est refusé avec un message explicite ; un seul coupon par achat. |
| RG-53 | Le prix appliqué est figé dans la commande au moment du paiement. |
| RG-54 | Seul un apprenant inscrit ayant suivi au moins 20 % du cours peut laisser un avis ; un avis par cours, modifiable. |

## 5. Exigences non fonctionnelles

La plateforme doit rester rapide sur une connexion 3G/4G moyenne et sur des téléphones d'entrée de gamme, car c'est l'usage dominant du public visé.

| Domaine | Exigence mesurable |
| --- | --- |
| Performance | Pages publiques : LCP < 2,5 s en 4G ; réponses API p95 < 300 ms (hors upload) ; démarrage vidéo < 3 s en 4G |
| Charge | 500 utilisateurs connectés simultanément et 100 lectures vidéo en parallèle sans dégradation |
| Disponibilité | ≥ 99,5 % par mois ; maintenance planifiée annoncée 48 h avant |
| Responsive | Mobile first, utilisable de 360 px à 1920 px ; lecteur vidéo et visionneuse PDF utilisables au doigt |
| Accessibilité | WCAG 2.1 niveau AA : contrastes, navigation clavier, textes alternatifs, sous-titres vidéo |
| Navigateurs | 2 dernières versions de Chrome, Firefox, Edge, Safari ; Chrome Android et Safari iOS |
| SEO | Rendu serveur des pages publiques, balises meta et Open Graph par cours, sitemap.xml, données structurées Course (schema.org) |
| Sécurité | HTTPS partout (TLS 1.2+), en-têtes de sécurité (Helmet, CSP), protection CSRF, limitation de débit, nettoyage du HTML de l'éditeur (anti-XSS), requêtes paramétrées (ORM), conformité OWASP Top 10 |
| Contenus protégés | Fichiers privés jamais servis en URL publique : URL signées à durée limitée, contrôle d'inscription avant chaque signature |
| Données personnelles | Conformité à la loi guinéenne L/2016/037 sur la cybersécurité et la protection des données et au RGPD pour les utilisateurs européens : consentement, export et suppression des données |
| Sauvegardes | Base PostgreSQL : sauvegarde complète quotidienne + journaux WAL (restauration à la minute), rétention 30 jours ; stockage objet versionné ; test de restauration mensuel |
| Observabilité | Logs structurés JSON (Pino), suivi d'erreurs (Sentry), métriques et alertes (Prometheus + Grafana ou équivalent), contrôle de santé /health |
| Qualité du code | TypeScript strict, ESLint + Prettier, couverture de tests ≥ 70 % sur les services métier, revue de code obligatoire |
| Langue et formats | Interface en français ; dates JJ/MM/AAAA ; montants en GNF avec séparateur de milliers ; fuseau Africa/Conakry |

## 6. Architecture et stack technique

Doztra-Learn est une application Next.js (App Router) organisée en domaines, qui sert à la fois l'API `/api/v1` (Route Handlers) et les pages (rendu serveur par Server Components), avec un worker séparé pour le traitement lourd des vidéos et des PDF. Ce choix garde une seule base de code TypeScript, un bon référencement des pages publiques et un déploiement simple.

&#91;embedded content: architecture Doztra-Learn · 8 composants\]

Le navigateur passe par Nginx vers l'application Next.js ; les traitements longs (transcodage, PDF, e-mails) partent en file Redis vers le worker, qui écrit les fichiers produits dans le stockage objet.

### 6.1 Stack retenue

| Couche | Technologie | Rôle |
| --- | --- | --- |
| Langage | TypeScript (strict) | Partout, côté serveur et navigateur |
| Framework | Next.js 16 (App Router, Cache Components) + React 19 | API REST (Route Handlers), rendu des pages, mutations par Server Actions |
| Rendu des pages | React Server Components + Tailwind CSS 4 | Pages rendues côté serveur, référencement des pages publiques |
| Interactivité | Client Components React ciblés ; éditeur et lecteurs chargés à la demande (`next/dynamic`) | Formulaires dynamiques, glisser-déposer, mises à jour partielles sans alourdir les pages publiques |
| Éditeur riche | Tiptap (ProseMirror), contenu stocké en JSON | Blocs, tableaux, images collées, blocs de code, encadrés |
| Coloration du code | Shiki (rendu côté serveur, thèmes clair et sombre) | Code coloré sans JavaScript lourd côté apprenant |
| Base de données | PostgreSQL 16 | Données métier, recherche plein texte (tsvector + unaccent + pg\_trgm) |
| ORM | Prisma (migrations versionnées) | Accès typé aux données |
| File de tâches | BullMQ + Redis 7 | Transcodage, miniatures, e-mails, certificats |
| Vidéo | FFmpeg (worker), sortie HLS ; lecteur Video.js + hls.js | Transcodage multi-résolution, miniatures, lecture adaptative |
| PDF | PDF.js (visionneuse), pdf-lib ou Puppeteer (certificats et reçus), pdftoppm (miniatures) | Lecture, génération, aperçus |
| Stockage fichiers | Stockage objet compatible S3 (MinIO auto-hébergé, ou AWS S3 / Cloudflare R2 / Wasabi) + CDN | Vidéos, PDF, images, ressources ; URL signées |
| Upload | tus (reprenable) ou upload multipart S3 direct depuis le navigateur | Gros fichiers sur connexions instables |
| Authentification | Sessions maison stockées dans PostgreSQL (e-mail + mot de passe Argon2id, Google OAuth), cookies httpOnly + Secure + SameSite | Pages, Server Actions et API |
| Validation | zod (schémas partagés client/serveur) | Toutes les entrées |
| E-mails | Nodemailer + fournisseur SMTP (Brevo, Mailgun…) | Notifications transactionnelles |
| Icônes | **Font Awesome 6, style Classic** (Solid et Regular), auto-hébergé | Toute l'interface (voir 6.3) |
| Documentation API | OpenAPI 3 générée depuis les schémas zod | Contrat d'API |
| Tests | Jest (unitaires et intégration des Route Handlers / Server Actions), Playwright (bout en bout) | Qualité |
| Déploiement | Docker + Docker Compose, Nginx (reverse proxy, TLS Let's Encrypt), CI GitHub Actions | Environnements dev, recette, production |

### 6.2 Organisation des domaines (`src/server/<domaine>/`)

| Domaine | Responsabilité |
| --- | --- |
| `auth` | Inscription, connexion, sessions, OAuth, réinitialisation |
| `users` | Profils apprenants, rôles, assistant |
| `catalog` | Catégories, tags, recherche, pages publiques |
| `courses` | Cours, sections, leçons, versions, publication |
| `editor` | Validation et rendu du contenu Tiptap (HTML nettoyé + Shiki) |
| `media` | Uploads, stockage S3, URL signées, miniatures |
| `video` | Pilotage du transcodage, statuts, lecture HLS |
| `learning` | Inscriptions, progression, notes personnelles |
| `quiz` | Quiz, questions, tentatives, correction |
| `certificates` | Génération et vérification des certificats |
| `payments` | Commandes, agrégateur Mobile Money/carte, webhooks, coupons, reçus |
| `community` | Questions/réponses, avis, signalements |
| `notifications` | In-app et e-mail |
| `studio` | Tableaux de bord, modération, audit, paramètres |
| `worker/` (processus séparé) | Consommateurs BullMQ : FFmpeg, PDF, e-mails, certificats |

### 6.3 Icônes Font Awesome Classic

Seuls les styles Classic Solid (`fa-solid`) et Classic Regular (`fa-regular`) sont utilisés, auto-hébergés (pas de kit CDN), pour un rendu identique hors connexion au CDN.

| Usage | Icône |
| --- | --- |
| Leçon vidéo | `fa-solid fa-circle-play` |
| Leçon textuelle | `fa-regular fa-file-lines` |
| Leçon PDF | `fa-regular fa-file-pdf` |
| Quiz | `fa-solid fa-list-check` |
| Bloc de code | `fa-solid fa-code` |
| Copier le code | `fa-regular fa-copy` |
| Image / capture | `fa-regular fa-image` |
| Ressource à télécharger | `fa-solid fa-download` |
| Leçon terminée | `fa-solid fa-circle-check` |
| Leçon verrouillée | `fa-solid fa-lock` |
| Certificat | `fa-solid fa-award` |
| Note / avis | `fa-solid fa-star` / `fa-regular fa-star` |
| Question/réponse | `fa-regular fa-comments` |
| Notifications | `fa-regular fa-bell` |
| Upload | `fa-solid fa-cloud-arrow-up` |
| Paiement | `fa-solid fa-mobile-screen-button` (Mobile Money), `fa-regular fa-credit-card` (carte) |
| Encadrés Info / Astuce / Attention / Important | `fa-solid fa-circle-info` / `fa-regular fa-lightbulb` / `fa-solid fa-triangle-exclamation` / `fa-solid fa-circle-exclamation` |
| Glisser-déposer | `fa-solid fa-grip-vertical` |
| Tableau de bord | `fa-solid fa-chart-line` |

## 7. Modèle de données (PostgreSQL)

Le modèle compte 32 tables. Clés primaires en UUID v7, horodatages `created_at` / `updated_at` sur chaque table, suppression logique (`deleted_at`) sur les contenus, montants en `BIGINT` (GNF sans décimales).

| Table | Colonnes principales | Relations |
| --- | --- | --- |
| `users` | id, email (unique, citext), password\_hash, first\_name, last\_name, avatar\_url, bio, phone, email\_verified\_at, status (active, banned), last\_login\_at | 1-n enrollments, orders, reviews |
| `user_roles` | user\_id, role (LEARNER, ASSISTANT, OWNER) ; un seul OWNER (index unique partiel) | n-1 users |
| `site_settings` | nom du site, logo, nom, photo et bio du formateur, réseaux sociaux, fournisseur de paiement, paramètres e-mail | ligne unique |
| `categories` | id, parent\_id, name, slug (unique), icon (classe Font Awesome), position | arborescence 2 niveaux |
| `tags` / `course_tags` | id, name, slug / course\_id, tag\_id | n-n courses |
| `courses` | id, category\_id, title, slug (unique), subtitle, description (JSONB), cover\_media\_id, trailer\_media\_id, level, language, price, compare\_at\_price, status (DRAFT, SCHEDULED, PUBLISHED, ARCHIVED), scheduled\_at, duration\_seconds, published\_at, search\_vector (tsvector) | 1-n sections |
| `course_objectives` | id, course\_id, kind (OBJECTIVE, PREREQUISITE), text, position | n-1 courses |
| `sections` | id, course\_id, title, position | 1-n lessons |
| `lessons` | id, section\_id, title, type (TEXT, VIDEO, PDF, QUIZ), position, is\_free\_preview, is\_published, duration\_seconds | 1-1 contenu selon le type |
| `lesson_contents` | id, lesson\_id, version, content\_json (JSONB Tiptap), content\_html (rendu nettoyé), word\_count, is\_current | n-1 lessons (historique) |
| `media` | id, owner\_id, kind (VIDEO, PDF, IMAGE, RESOURCE, SUBTITLE), storage\_key, original\_name, mime\_type, size\_bytes, checksum, status (UPLOADING, QUEUED, PROCESSING, READY, FAILED), error\_message | référencé par lessons, courses |
| `video_assets` | id, media\_id, lesson\_id, duration\_seconds, hls\_master\_key, renditions (JSONB : 360p, 720p, 1080p), thumbnail\_media\_id, progress\_percent | 1-1 media |
| `video_thumbnails` | id, video\_asset\_id, media\_id, source (AUTO, CUSTOM), is\_selected | n-1 video\_assets |
| `pdf_documents` | id, media\_id, lesson\_id, page\_count, thumbnail\_media\_id, allow\_download | 1-1 media |
| `lesson_resources` | id, lesson\_id, media\_id, label | n-1 lessons |
| `enrollments` | id, user\_id, course\_id, source (FREE, PURCHASE, ADMIN), progress\_percent, last\_lesson\_id, completed\_at ; unique (user\_id, course\_id) | n-1 users, courses |
| `lesson_progress` | id, enrollment\_id, lesson\_id, status (STARTED, COMPLETED), last\_position\_seconds, completed\_at ; unique (enrollment\_id, lesson\_id) | n-1 enrollments |
| `notes` | id, user\_id, lesson\_id, timestamp\_seconds, body | n-1 users |
| `quizzes` / `questions` / `answer_options` | quiz : lesson\_id, pass\_score, max\_attempts, time\_limit\_seconds, shuffle ; question : type, prompt (JSONB), points, explanation, position ; option : text, is\_correct | 1-n |
| `quiz_attempts` | id, user\_id, quiz\_id, started\_at, submitted\_at, score, passed, answers (JSONB) | n-1 quizzes |
| `certificates` | id, user\_id, course\_id, code (unique), full\_name, issued\_at, pdf\_media\_id | unique (user\_id, course\_id) |
| `orders` | id, user\_id, course\_id, coupon\_id, amount, currency, status (PENDING, PAID, FAILED, REFUNDED), provider, provider\_reference (unique), paid\_at | 1-n payment\_events |
| `payment_events` / `coupons` | événement : order\_id, type, payload (JSONB), received\_at ; coupon : code (unique), kind (PERCENT, FIXED), value, max\_uses, used\_count, expires\_at, course\_ids | n-1 orders |
| `questions_threads` / `replies` | thread : lesson\_id, user\_id, title, body (JSONB), is\_resolved ; réponse : thread\_id, user\_id, body, is\_instructor\_answer | 1-n |
| `reviews` | id, user\_id, course\_id, rating (1-5), comment, instructor\_reply ; unique (user\_id, course\_id) | n-1 courses |
| `notifications` / `audit_logs` | notification : user\_id, type, payload, read\_at ; audit : actor\_id, action, entity, entity\_id, metadata, ip | n-1 users |

Index clés : GIN sur `courses.search_vector`, trigram sur `courses.title`, index sur `lessons(section_id, position)`, `lesson_progress(enrollment_id)`, `orders(provider_reference)`.

## 8. API, écrans, planning et recette

### 8.1 Principaux points d'entrée de l'API (`/api/v1`)

| Méthode et route | Usage | Accès |
| --- | --- | --- |
| `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` | Comptes et sessions | Public |
| `POST /auth/forgot-password` · `POST /auth/reset-password` | Réinitialisation | Public |
| `GET /courses` · `GET /courses/:slug` | Catalogue, recherche, fiche | Public |
| `POST /studio/courses` · `PATCH /studio/courses/:id` | Créer, modifier un cours | Formateur |
| `POST /studio/courses/:id/publish` | Publier maintenant ou programmer | Formateur |
| `POST /studio/sections` · `PATCH /studio/sections/reorder` | Sections et ordre | Formateur |
| `POST /studio/lessons` · `PUT /studio/lessons/:id/content` | Leçons et contenu Tiptap | Formateur |
| `POST /media/uploads` · `PATCH /media/uploads/:id` (tus) | Upload fractionné | Formateur |
| `GET /media/:id/status` · `PUT /videos/:id/thumbnail` | Suivi du transcodage, choix de la miniature | Formateur |
| `GET /lessons/:id` · `GET /lessons/:id/playback` | Contenu et URL HLS signée | Apprenant inscrit |
| `PUT /lessons/:id/progress` | Position vidéo, leçon terminée | Apprenant inscrit |
| `POST /quizzes/:id/attempts` · `POST /attempts/:id/submit` | Passer un quiz | Apprenant inscrit |
| `GET /certificates/verify/:code` | Vérifier un certificat | Public |
| `POST /orders` · `POST /payments/webhook/:provider` | Achat, confirmation signée | Apprenant / agrégateur |
| `GET /studio/students` · `PATCH /studio/students/:id` | Gestion des apprenants | Formateur |
| `GET /studio/threads` · `POST /threads/:id/replies` | Questions à traiter, réponses | Formateur, Assistant |

Toutes les réponses d'erreur suivent un format unique `{ statusCode, code, message, details }`. Le contrat complet est publié en OpenAPI sur `/api/docs` (recette uniquement).

### 8.2 Inventaire des écrans (24)

| Espace | Écrans |
| --- | --- |
| Public (7) | Accueil · Catalogue et recherche · Fiche cours · À propos du formateur · Vérification de certificat · Connexion / inscription · Mot de passe oublié |
| Apprenant (7) | Mes cours · Lecteur de cours (texte, vidéo, PDF) · Quiz et résultat · Mes certificats · Paiement et confirmation · Historique des achats · Profil et paramètres |
| Espace formateur (10) | Tableau de bord · Mes cours · Éditeur de cours (infos, programme, prix, publication) · Éditeur de leçon textuelle · Import vidéo et choix de miniature · Éditeur de quiz · Questions et avis · Apprenants · Paiements, remboursements et coupons · Catégories, modération et paramètres du site |

Une maquette haute fidélité de chaque écran (mobile et bureau) est validée avant son développement.

### 8.3 Planning prévisionnel (16 semaines)

Le MVP est livrable en 16 semaines avec une équipe de 2 développeurs full stack et 1 designer à mi-temps, en sprints de 2 semaines avec démonstration à chaque fin de sprint.

| Phase | Semaines | Contenu | Jalon |
| --- | --- | --- | --- |
| 1. Cadrage et design | S1-S2 | Validation du cahier des charges, maquettes, charte, architecture | Maquettes validées |
| 2. Socle | S3-S4 | Infrastructure Docker, CI, AUTH, utilisateurs, rôles, mise en page Tailwind + Font Awesome | Connexion fonctionnelle |
| 3. Cours et éditeur | S5-S7 | CAT, COURS, éditeur Tiptap, code coloré Shiki, images collées | Premier cours textuel publié |
| 4. Vidéo et PDF | S8-S10 | Upload reprenable, worker FFmpeg/HLS, miniatures, lecteur, visionneuse PDF | Vidéo lue en 3 qualités |
| 5. Apprentissage | S11-S12 | Inscriptions, progression, quiz, certificats | Parcours complet jusqu'au certificat |
| 6. Paiement et communauté | S13-S14 | Mobile Money/carte, coupons, reçus, Q&R, avis, notifications | Premier achat réel en recette |
| 7. Admin, recette, lancement | S15-S16 | Tableaux de bord, modération, tests de charge, sécurité, corrections, mise en production | Mise en ligne |

### 8.4 Livrables

- Code source complet (dépôt Git) avec README d'installation
- Fichiers Docker Compose pour développement, recette et production
- Schéma de base de données et migrations Prisma, jeu de données de démonstration
- Documentation API OpenAPI
- Maquettes des 24 écrans
- Rapport de tests (unitaires, intégration, bout en bout, charge)
- Guide formateur et guide administrateur (PDF ou cours dans la plateforme elle-même)

### 8.5 Critères d'acceptation de la recette

- [ ] Toutes les exigences de priorité M (F-xx) passent leurs scénarios de test
- [ ] Les 28 règles de gestion (RG-xx) sont couvertes par des tests automatisés
- [ ] Une vidéo de 1 Go est importée, transcodée en 360p/720p/1080p avec miniature et lue sur Android en 4G en moins de 3 s
- [ ] Une leçon avec 5 blocs de code dans 5 langages différents s'affiche correctement colorée, en thème clair et sombre
- [ ] Une capture d'écran collée avec Ctrl+V s'importe et s'affiche dans la leçon
- [ ] Un PDF de 50 pages s'affiche dans la visionneuse et respecte le réglage de téléchargement
- [ ] Un paiement Orange Money de test ouvre l'accès au cours uniquement après réception du webhook
- [ ] Un certificat est émis à 100 % de progression et vérifiable par son QR code
- [ ] Aucune vulnérabilité critique ou haute au scan de sécurité (OWASP ZAP, npm audit)
- [ ] Score Lighthouse mobile ≥ 85 (performance et accessibilité) sur l'accueil, le catalogue et la fiche cours
