"use client";

import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { faCircleExclamation, faCircleInfo, faSpinner } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { startTransition, useActionState, useId, useState } from "react";

import { loginAction } from "@/app/auth-actions";
import { Icon } from "@/components/icon";
import { buttonStyles, inputStyles } from "@/components/ui";
import { initialActionState } from "@/shared/action-state";

function GoogleButton() {
  return (
    <>
      <button
        type="button"
        disabled
        title="Bientôt disponible"
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line-strong bg-white p-3.5 text-[15px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-[17px] font-extrabold text-terracotta" aria-hidden="true">
          G
        </span>
        Continuer avec Google (bientôt)
      </button>
      <div className="my-5 flex items-center gap-3 text-[13px] text-subtle">
        <span className="h-px flex-1 bg-[#EFE7DA]" />
        ou avec votre e-mail
        <span className="h-px flex-1 bg-[#EFE7DA]" />
      </div>
    </>
  );
}

function PasswordInput({ id, autoComplete, describedBy, invalid }: { id: string; autoComplete: string; describedBy?: string; invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="flex items-center rounded-base border border-line-strong bg-paper pr-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-gold">
      <input
        id={id}
        type={visible ? "text" : "password"}
        name="password"
        required
        maxLength={128}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        placeholder="••••••••"
        className="min-w-0 flex-1 bg-transparent p-3.5 text-base outline-none focus-visible:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="grid size-10 place-items-center text-muted"
      >
        <Icon icon={visible ? faEyeSlash : faEye} />
      </button>
    </span>
  );
}

/** F-02 : connexion réelle (Server Action loginAction, RG-04). */
export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialActionState);
  const id = useId();
  const errors = state.fieldErrors ?? {};

  return (
    <>
      <GoogleButton />
      <form
        action={action}
        // Avec JavaScript : pas de remise à zéro du formulaire après une erreur (l'e-mail reste saisi).
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-3.5"
        noValidate
      >
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className="text-[13px] font-bold text-ink-700">
            Adresse e-mail
          </label>
          <input
            id={`${id}-email`}
            type="email"
            name="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder="vous@exemple.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${id}-email-erreur` : undefined}
            className={inputStyles}
          />
          {errors.email ? (
            <span id={`${id}-email-erreur`} className="text-xs font-semibold text-danger">
              {errors.email}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-pw`} className="text-[13px] font-bold text-ink-700">
            Mot de passe
          </label>
          <PasswordInput
            id={`${id}-pw`}
            autoComplete="current-password"
            invalid={!!errors.password}
            describedBy={errors.password ? `${id}-pw-erreur` : undefined}
          />
          {errors.password ? (
            <span id={`${id}-pw-erreur`} className="text-xs font-semibold text-danger">
              {errors.password}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-sm">
          <label className="flex items-center gap-2 text-ink-700">
            <input type="checkbox" name="remember" defaultChecked className="size-[18px] accent-forest" />
            Se souvenir de moi
          </label>
          <Link href="/forgot-password" className="font-bold text-terracotta-700 hover:text-forest">
            Mot de passe oublié ?
          </Link>
        </div>
        <p role="alert" aria-live="assertive" className="text-sm font-semibold text-danger empty:hidden">
          {!state.ok && state.message ? (
            <>
              <Icon icon={faCircleExclamation} /> {state.message}
            </>
          ) : null}
        </p>
        <button type="submit" disabled={pending} aria-busy={pending} className={`${buttonStyles.block} mt-1.5`}>
          {pending ? <Icon icon={faSpinner} spin /> : null}
          Se connecter
        </button>
      </form>
      <p className="mt-6 text-center text-[15px] text-muted">
        Nouveau sur Doztra-Learn ?{" "}
        <Link href="/register" className="font-bold text-terracotta-700 hover:text-forest">
          Créer un compte
        </Link>
      </p>
    </>
  );
}

/**
 * Inscription (prototype « auth »). DÉMONSTRATION : rien n'est envoyé.
 * Branchée avec la vérification d'e-mail (F-01, RG-01 à RG-03).
 */
export function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const hintId = useId();
  return (
    <>
      <GoogleButton />
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
          <label className="flex flex-col gap-1.5 text-[13px] font-bold text-ink-700">
            Prénom
            <input name="firstName" required autoComplete="given-name" maxLength={80} placeholder="Aïssatou" className={inputStyles} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold text-ink-700">
            Nom
            <input name="lastName" required autoComplete="family-name" maxLength={80} placeholder="Diallo" className={inputStyles} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold text-ink-700">
          Adresse e-mail
          <input type="email" name="email" required autoComplete="email" maxLength={254} placeholder="vous@exemple.com" className={inputStyles} />
        </label>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${hintId}-pw`} className="text-[13px] font-bold text-ink-700">
            Mot de passe
          </label>
          <PasswordInput id={`${hintId}-pw`} autoComplete="new-password" describedBy={hintId} />
        </div>
        <span id={hintId} className="-mt-1.5 text-[13px] text-muted">
          <Icon icon={faCircleInfo} /> 8 caractères minimum, au moins une lettre et un chiffre.
        </span>
        <label className="flex gap-2.5 text-sm leading-normal text-ink-700">
          <input type="checkbox" required className="mt-0.5 size-[18px] shrink-0 accent-forest" />
          J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité.
        </label>
        <button type="submit" className={`${buttonStyles.block} mt-1.5`}>
          Créer mon compte
        </button>
        <p role="status" aria-live="polite" className="text-[13px] text-warning empty:hidden">
          {submitted ? "Démonstration : l'inscription des apprenants sera disponible avec la vérification de l'e-mail." : ""}
        </p>
      </form>
      <p className="mt-6 text-center text-[15px] text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-bold text-terracotta-700 hover:text-forest">
          Se connecter
        </Link>
      </p>
    </>
  );
}
