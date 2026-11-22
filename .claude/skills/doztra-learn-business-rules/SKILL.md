---
name: doztra-learn-business-rules
description: Utiliser pour implémenter, tester ou relire toute fonctionnalité de Doztra-Learn touchant comptes et rôles, cours, sections, leçons, publication, fichiers, progression, quiz, certificats, avis ou coupons — checklist RG-01 à RG-54, états et invariants.
---

# Doztra-Learn — règles de gestion

Plateforme à **formateur unique**. Chaque règle ci-dessous est appliquée dans un service de `src/server/<domaine>/` (jamais seulement dans un composant React), couverte par au moins un test nommé avec son identifiant, et produit une erreur métier explicite (code stable + message français) en cas de refus.

## Rôles

| Rôle | Portée |
| --- | --- |
| Visiteur | Catalogue, fiche cours, leçons `is_free_preview`, inscription/connexion |
| `LEARNER` | Inscription aux cours, leçons, quiz, Q&R, avis, certificats |
| `ASSISTANT` (optionnel) | Répondre aux questions, modérer ; **aucun** accès à l'édition de cours, aux paiements, aux paramètres |
| `OWNER` | Tout `/studio` : cours, médias, apprenants, paiements, coupons, catégories, paramètres |

Un utilisateur peut avoir `LEARNER` + `ASSISTANT`. `OWNER` est unique (index unique partiel sur `user_roles(role) WHERE role = 'OWNER'`).

## Checklist des règles

### Comptes
- **RG-01** E-mail unique, insensible à la casse (`citext`).
- **RG-02** Mot de passe ≥ 8 caractères, ≥ 1 lettre et 1 chiffre ; haché Argon2id.
- **RG-03** Compte non vérifié : connexion possible, mais ni achat ni inscription à un cours (`EMAIL_NOT_VERIFIED`).
- **RG-04** 5 échecs de connexion en 15 min → blocage 15 min (compteurs en PostgreSQL, table `login_attempts`, clés hachées, par e-mail **et** par IP ; l'IP n'est comptée que si elle est fiable, `TRUST_PROXY=true`).
- **RG-05** Un seul `OWNER`, créé par la commande CLI `npm run cli -- owner:create`. Aucune page, Server Action ni Route Handler ne peut attribuer `OWNER`. Seul l'OWNER attribue/retire `ASSISTANT`.

### Cours et leçons
- **RG-10** Publication possible seulement si : titre, description, image de couverture, catégorie, ≥ 1 section, ≥ 3 leçons publiables.
- **RG-11** Leçon vidéo publiable seulement si `media.status = READY` et une miniature sélectionnée.
- **RG-12** L'OWNER publie lui-même (pas de revue). Publication programmée : `status = SCHEDULED` + `scheduled_at` ; un job BullMQ répétable (exécuté par le worker) publie à l’heure (revalide RG-10 au moment de publier).
- **RG-13** Modifier un cours publié travaille sur un brouillon ; les apprenants voient la version publiée jusqu'à republication (`lesson_contents.is_current`).
- **RG-14** Cours avec ≥ 1 inscrit : suppression interdite, archivage seulement ; les inscrits gardent l'accès.
- **RG-15** Durée du cours = Σ durées vidéo + temps de lecture des leçons texte (200 mots/min). Recalculée à chaque publication.
- **RG-16** Slug unique ; doublon → suffixe `-2`, `-3`… Le slug d'un cours publié ne change plus (redirection 301 si renommé).

### Fichiers
- **RG-20** Type réel vérifié par signature (magic bytes), pas par extension ni par `Content-Type` client.
- **RG-21** Limites : vidéo 2 Go, PDF 100 Mo, image 10 Mo, ressource 50 Mo. Alerte OWNER à 80 % de la capacité de stockage.
- **RG-22** Fichier retiré d'une leçon → corbeille 30 jours (`deleted_at`) puis purge du stockage par job.

### Apprentissage
- **RG-30** Accès à une leçon non `is_free_preview` ⇔ inscription active au cours (vérifié à chaque rendu de page de leçon, Server Action, Route Handler de contenu **et** à chaque signature d'URL média ; jamais seulement dans `proxy.ts` ou un layout).
- **RG-31** Vidéo terminée à 90 % de la durée ; position envoyée toutes les 15 s ; le serveur n'accepte pas de saut de progression incohérent (position > durée, ou progression qui avance plus vite que le temps réel × 2,5).
- **RG-32** Progression = leçons terminées / leçons publiées × 100, arrondi à l'entier ; recalculée quand une leçon est ajoutée ou retirée.
- **RG-33** Certificat émis quand progression = 100 % et tous les quiz obligatoires réussis ; un seul par (apprenant, cours) — contrainte unique.
- **RG-34** Nom imprimé figé à l'émission, confirmé par l'apprenant avant génération.

### Quiz
- **RG-40** Score = points obtenus / points possibles ; réussi si score ≥ `pass_score` (défaut 70 %).
- **RG-41** Tentatives épuisées → délai de 24 h avant une nouvelle série.
- **RG-42** Durée limite : le serveur fait foi (`started_at` + `time_limit_seconds`) ; soumission tardive refusée. Les bonnes réponses ne sont **jamais** envoyées au navigateur avant soumission.

### Paiement et avis
- **RG-50** Accès payant ouvert uniquement après webhook vérifié (voir `doztra-learn-payments`).
- **RG-51** Webhook idempotent : clé = `provider_reference` unique.
- **RG-52** Coupon expiré, épuisé ou hors périmètre → refus explicite ; un coupon par achat ; `used_count` incrémenté dans la même transaction que le passage `PAID`.
- **RG-53** Prix figé dans la commande à sa création.
- **RG-54** Avis réservé aux inscrits ayant ≥ 20 % de progression ; un par cours, modifiable.

## Machines à états

```
Cours   : DRAFT → PUBLISHED | DRAFT → SCHEDULED → PUBLISHED | PUBLISHED → ARCHIVED | ARCHIVED → PUBLISHED
Média   : UPLOADING → QUEUED → PROCESSING → READY | PROCESSING → FAILED → QUEUED (relance)
Commande: PENDING → PAID | PENDING → FAILED | PAID → REFUNDED
Leçon   : (progression) STARTED → COMPLETED (jamais l'inverse)
```

Toute transition passe par une méthode de service dédiée (`publish()`, `archive()`, `markPaid()`…) qui vérifie l'état source ; jamais de `update({ status })` direct depuis une Server Action, un Route Handler ou une page. Une publication, un archivage ou un changement de prix invalide le cache public concerné (`revalidateTag`).

## Codes d'erreur métier (exemples)

`EMAIL_TAKEN`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_LOCKED`, `COURSE_NOT_PUBLISHABLE` (avec `details.missing[]`), `LESSON_NOT_PUBLISHABLE`, `COURSE_HAS_ENROLLMENTS`, `FILE_TYPE_REJECTED`, `FILE_TOO_LARGE`, `NOT_ENROLLED`, `QUIZ_ATTEMPTS_EXHAUSTED`, `QUIZ_TIME_EXPIRED`, `COUPON_INVALID`, `REVIEW_NOT_ALLOWED`, `CERTIFICATE_ALREADY_ISSUED`.

## Tests minimaux par règle

Pour chaque RG : un cas nominal, un cas de refus, et pour les règles d'accès les 4 profils (anonyme, apprenant non inscrit, assistant, owner). Les règles de concurrence (RG-33, RG-51, RG-52) ont un test qui lance deux appels simultanés.

Un même cas est testé au niveau du service (Jest) ; les règles d'accès sont aussi testées sur la page, la Server Action ou le Route Handler qui les expose, car chacun est un point d'entrée distinct.
