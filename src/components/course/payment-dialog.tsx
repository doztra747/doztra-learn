"use client";

import { faCreditCard, faCircle } from "@fortawesome/free-regular-svg-icons";
import {
  faCircleCheck,
  faCircleDot,
  faCircleExclamation,
  faCircleInfo,
  faLock,
  faMobileScreenButton,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CATEGORY_ICON_DEFS, Icon } from "@/components/icon";
import { buttonStyles, courseTone, inputStyles, toneFor } from "@/components/ui";
import type { CategoryIcon } from "@/shared/courses";
import { formatGnf } from "@/shared/format";

type Method = "om" | "momo" | "card";
type Step = "form" | "pending" | "done";

const METHODS: { id: Method; label: string; sub: string; icon: typeof faCreditCard; tint: string }[] = [
  { id: "om", label: "Orange Money", sub: "Validation sur votre téléphone", icon: faMobileScreenButton, tint: "bg-warning-bg text-warning" },
  { id: "momo", label: "MTN MoMo", sub: "Validation sur votre téléphone", icon: faMobileScreenButton, tint: "bg-warning-bg text-warning" },
  { id: "card", label: "Carte bancaire", sub: "Visa, Mastercard", icon: faCreditCard, tint: "bg-mint text-forest" },
];

/**
 * Modale « Paiement sécurisé » (prototype). DÉMONSTRATION : aucun paiement n'est envoyé.
 * Phase 7 : Server Action createOrder (prix et coupon recalculés côté serveur, RG-52/53),
 * attente par interrogation de /api/v1/orders/[id]/status, accès ouvert uniquement par webhook (RG-50).
 */
export function PaymentDialog({ course }: { course: { slug: string; title: string; price: number; icon: CategoryIcon } }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<Method>("om");
  const [coupon, setCoupon] = useState("");
  const [couponOk, setCouponOk] = useState<boolean | null>(null);

  const discountPercent = couponOk ? 20 : 0;
  const total = Math.round((course.price * (100 - discountPercent)) / 100);
  const methodLabel = METHODS.find((m) => m.id === method)!.label;

  useEffect(() => {
    if (step !== "pending") return;
    const timer = setTimeout(() => setStep("done"), 2600);
    return () => clearTimeout(timer);
  }, [step]);

  const open = () => {
    setStep("form");
    setCoupon("");
    setCouponOk(null);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" onClick={open} className={buttonStyles.block}>
        Acheter le cours
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="titre-paiement"
        className="m-auto max-h-[92vh] w-[calc(100%-32px)] max-w-[520px] overflow-auto rounded-[26px] bg-white px-[clamp(18px,4vw,28px)] pt-6 pb-7 text-ink backdrop:bg-forest-900/55"
      >
        <div className="mb-[18px] flex items-center justify-between">
          <h2 id="titre-paiement" className="text-[22px] tracking-normal">
            Paiement sécurisé
          </h2>
          <button type="button" onClick={close} aria-label="Fermer" className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink">
            <Icon icon={faXmark} />
          </button>
        </div>

        {step === "form" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStep("pending");
            }}
          >
            <p className="flex items-start gap-2 rounded-base bg-warning-bg px-3 py-2.5 text-[13px] text-warning">
              <Icon icon={faCircleInfo} className="mt-0.5" />
              Démonstration : aucun paiement réel n&apos;est effectué.
            </p>
            <div className="flex items-center gap-3 rounded-lg bg-paper p-3">
              <span className={`grid size-12 shrink-0 place-items-center rounded-md text-lg ${courseTone(toneFor(course.slug))}`}>
                <Icon icon={CATEGORY_ICON_DEFS[course.icon]} />
              </span>
              <span className="text-[15px] leading-[1.35] font-bold">{course.title}</span>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Moyen de paiement</legend>
              {METHODS.map((m) => {
                const selected = method === m.id;
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3.5 rounded-md border-[1.5px] p-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-gold ${
                      selected ? "border-forest bg-[#F4F8F7]" : "border-line-strong bg-white"
                    }`}
                  >
                    <input type="radio" name="method" value={m.id} checked={selected} onChange={() => setMethod(m.id)} className="sr-only" />
                    <span className={`grid size-10 shrink-0 place-items-center rounded-base ${m.tint}`}>
                      <Icon icon={m.icon} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-bold">{m.label}</span>
                      <span className="text-[13px] text-muted">{m.sub}</span>
                    </span>
                    <Icon icon={selected ? faCircleDot : faCircle} className={`text-lg ${selected ? "text-forest" : "text-[#B5BFBC]"}`} />
                  </label>
                );
              })}
            </fieldset>

            {method === "card" ? (
              <p className="flex items-start gap-2 text-[13px] leading-normal text-muted">
                <Icon icon={faLock} className="mt-0.5" />
                Vous serez redirigé vers la page sécurisée de l&apos;opérateur pour saisir votre carte. Doztra-Learn ne voit jamais votre numéro de carte.
              </p>
            ) : (
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-ink-700">
                Numéro {methodLabel}
                <input type="tel" name="phone" required autoComplete="tel" placeholder="+224 6XX XX XX XX" className={inputStyles} />
              </label>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="coupon" className="text-[13px] font-bold text-ink-700">
                Code promo
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon"
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value.toUpperCase());
                    setCouponOk(null);
                  }}
                  placeholder="DOZTRA20"
                  maxLength={32}
                  aria-describedby="coupon-etat"
                  className={`${inputStyles} min-w-0 flex-1 py-[13px] uppercase`}
                />
                <button
                  type="button"
                  onClick={() => setCouponOk(coupon.trim() === "DOZTRA20")}
                  className="rounded-base border border-forest bg-white px-4 font-bold text-forest"
                >
                  Appliquer
                </button>
              </div>
              <p id="coupon-etat" aria-live="polite" className="text-[13px] font-semibold">
                {couponOk === true ? (
                  <span className="text-success">
                    <Icon icon={faCircleCheck} /> Coupon appliqué : −20 %
                  </span>
                ) : couponOk === false ? (
                  <span className="text-terracotta-700">
                    <Icon icon={faCircleExclamation} /> Ce coupon est expiré ou ne s&apos;applique pas à ce cours.
                  </span>
                ) : null}
              </p>
            </div>

            <dl className="flex flex-col gap-2 border-t border-[#EFE7DA] pt-3.5 text-[15px]">
              <div className="flex justify-between text-ink-700">
                <dt>Prix du cours</dt>
                <dd>{formatGnf(course.price)}</dd>
              </div>
              {couponOk ? (
                <div className="flex justify-between text-success">
                  <dt>Réduction</dt>
                  <dd>− {formatGnf(course.price - total)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-extrabold text-forest">
                <dt>Total</dt>
                <dd>{formatGnf(total)}</dd>
              </div>
            </dl>
            <button type="submit" className={buttonStyles.block}>
              Payer {formatGnf(total)}
            </button>
            <p className="text-center text-xs leading-normal text-muted">
              <Icon icon={faLock} /> L&apos;accès s&apos;ouvre dès la confirmation de l&apos;opérateur. Un reçu PDF vous est envoyé par e-mail.
            </p>
          </form>
        ) : null}

        {step === "pending" ? (
          <div className="flex flex-col items-center gap-3.5 pt-6 pb-2 text-center" role="status" aria-live="polite">
            <span className="block size-[54px] animate-spin rounded-full border-4 border-[#EFE7DA] border-t-terracotta" aria-hidden="true" />
            <h3 className="mt-1.5 text-xl tracking-normal">
              {method === "card" ? "Redirection vers l'opérateur" : "Validez sur votre téléphone"}
            </h3>
            <p className="max-w-[340px] text-[15px] leading-relaxed text-muted">
              {method === "card"
                ? `Vous allez être redirigé vers la page de paiement sécurisée pour régler ${formatGnf(total)}.`
                : `Composez votre code secret ${methodLabel} pour confirmer le paiement de ${formatGnf(total)}. Nous attendons la confirmation de l'opérateur.`}
            </p>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="flex flex-col items-center gap-3.5 pt-4 pb-1 text-center" role="status" aria-live="polite">
            <span className="grid size-16 place-items-center rounded-full bg-success-bg text-[28px] text-success">
              <Icon icon={faCircleCheck} />
            </span>
            <h3 className="text-[22px] tracking-normal">Paiement confirmé</h3>
            <p className="max-w-[340px] text-[15px] leading-relaxed text-muted">
              Votre accès est ouvert. Le reçu a été envoyé à votre adresse e-mail.
            </p>
            <Link href="/my-courses" className={`${buttonStyles.block} mt-1.5 hover:text-white`}>
              Aller à mes cours
            </Link>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
