import type { Metadata } from "next";
import Link from "next/link";

import { AuthLayout } from "@/components/auth/auth-layout";
import { buttonStyles, inputStyles } from "@/components/ui";

export const metadata: Metadata = { title: "Mot de passe oublié" };

/** F-03. Démonstration : le formulaire n'envoie rien (phase 3 : Server Action, lien valable 1 h, réponse identique que l'e-mail existe ou non). */
export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Mot de passe oublié"
      intro="Indiquez votre adresse e-mail : si un compte existe, vous recevrez un lien de réinitialisation valable 1 heure."
    >
      <form className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[13px] font-bold text-ink-700">
          Adresse e-mail
          <input type="email" name="email" required autoComplete="email" maxLength={254} placeholder="vous@exemple.com" className={inputStyles} />
        </label>
        <button type="submit" disabled className={`${buttonStyles.block} mt-1.5`}>
          Envoyer le lien
        </button>
        <p className="text-[13px] text-warning">Démonstration : l&apos;envoi du lien sera disponible à la phase 3 du projet.</p>
      </form>
      <p className="mt-6 text-center text-[15px] text-muted">
        <Link href="/login" className="font-bold text-terracotta-700 hover:text-forest">
          Retour à la connexion
        </Link>
      </p>
    </AuthLayout>
  );
}
