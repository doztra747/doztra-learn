---
name: doztra-learn-payments
description: Utiliser pour implémenter ou relire le paiement de Doztra-Learn — commandes en GNF, Orange Money, MTN MoMo et carte via un agrégateur, webhooks signés et idempotents, coupons, reçus PDF, remboursements et écran de paiement du prototype.
---

# Doztra-Learn — paiements

L'agrégateur n'est pas encore choisi (CinetPay, PayDunya, Lengo Pay…). Le code métier ne dépend que d'une interface ; chaque fournisseur est un adaptateur.

```ts
interface PaymentProvider {
  readonly name: 'cinetpay' | 'paydunya' | 'lengopay' | 'fake';
  createPayment(input: { orderId: string; amount: bigint; currency: 'GNF'; customer: { email: string; phone?: string };
                         method: 'ORANGE_MONEY' | 'MTN_MOMO' | 'CARD'; returnUrl: string; notifyUrl: string }):
    Promise<{ providerReference: string; redirectUrl?: string; ussdPrompt?: boolean }>;
  verifyWebhook(rawBody: Buffer, headers: Record<string, string>): WebhookEvent; // lève si signature invalide
  fetchStatus(providerReference: string): Promise<'PENDING' | 'PAID' | 'FAILED'>;   // double vérification
  refund?(providerReference: string, amount: bigint): Promise<void>;
}
```

L'adaptateur `fake` (dev et tests) simule succès, échec, attente et webhook en double.

## Parcours (prototype : modale « Paiement sécurisé »)

1. Apprenant vérifié (RG-03) clique « Acheter » → modale : récapitulatif, champ coupon (états valide / invalide), choix Orange Money · MTN MoMo · Carte.
2. Server Action `createOrder` (ou `POST /api/v1/orders`) : `requireUser()`, puis recalcule le prix **côté serveur** depuis le cours (jamais depuis le formulaire), applique le coupon (RG-52), fige le montant (RG-53), crée `orders(PENDING)`, appelle `createPayment`.
3. Mobile Money : écran « Validez sur votre téléphone » (spinner, `aria-live`), un Client Component interroge `GET /api/v1/orders/[id]/status` (dynamique, `no-store`) toutes les 3 s pendant 5 min max. Carte : redirection vers la page du fournisseur.
4. Webhook → passage `PAID` → inscription → écran « Paiement confirmé » + bouton « Commencer le cours ».
5. Le retour navigateur (`returnUrl`) n'ouvre **jamais** l'accès : il affiche l'état réel de la commande.

## Webhook (RG-50, RG-51)

- Route Handler `src/app/api/v1/payments/webhook/[provider]/route.ts` (`POST` seulement, runtime Node.js) : public, exclu des redirections de `proxy.ts`, pas de Server Action. Corps brut lu par `await request.text()` (ou `arrayBuffer()`) **avant** tout `JSON.parse`, pour vérifier la signature sur les octets reçus.
- Étapes : vérifier la signature (comparaison à temps constant) → enregistrer `payment_events` (toujours, même en double) → `fetchStatus` auprès du fournisseur pour confirmer → transaction :
  - verrouiller la commande (`SELECT … FOR UPDATE`) ;
  - si déjà `PAID` : ne rien faire, répondre 200 ;
  - vérifier montant et devise identiques à la commande, sinon alerte et pas d'accès ;
  - `PAID`, `paid_at`, incrément `coupons.used_count` (avec contrôle `used_count < max_uses`), création de l'`enrollment` (`source = PURCHASE`, contrainte unique) ;
  - commit, puis jobs `mail` (reçu) en dehors de la transaction.
- Répondre 200 rapidement ; toute erreur interne après enregistrement de l'événement est rejouable par un job de réconciliation.
- Réconciliation : job `payment-reconcile` (worker) toutes les 15 min sur les commandes `PENDING` de plus de 10 min → `fetchStatus`.

## Coupons (F-83)

`PERCENT` (1–100) ou `FIXED` (≤ prix), `expires_at`, `max_uses`, `course_ids` (vide = tous). Code normalisé en majuscules, unique. Montant final ≥ 0 ; montant 0 → inscription directe sans fournisseur, commande `PAID` avec `provider = 'coupon'`.

## Reçus et remboursements (F-84, F-85)

- Reçu PDF (job `mail`) : Doztra SARL, coordonnées, n° de commande, cours, montant GNF, moyen, date ; stocké en `res/receipts/` et lié à l'historique des achats.
- Remboursement par l'OWNER uniquement, motif obligatoire, journal d'audit, `REFUNDED` + révocation de l'inscription (sauf si un certificat a été émis : à confirmer explicitement).

## Montants

`BigInt` en GNF, sans décimales ; affichage `Intl.NumberFormat('fr-GN')` + « GNF ». Aucun calcul en `number` flottant.

## Tests obligatoires

Webhook signature invalide (401, rien ne change) · webhook en double et simultané (une seule inscription) · montant différent (pas d'accès) · coupon au dernier usage pris par deux achats simultanés (un seul réussit) · retour navigateur sans webhook (pas d'accès) · réconciliation d'une commande payée dont le webhook a été perdu.
