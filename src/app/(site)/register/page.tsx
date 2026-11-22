import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PHOTOS } from "@/components/ui";

export const metadata: Metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <AuthLayout photo={PHOTOS.inscription} title="Créez votre compte" intro="Gratuit. Un e-mail de vérification vous sera envoyé.">
      <RegisterForm />
    </AuthLayout>
  );
}
