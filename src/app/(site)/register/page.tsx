import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <AuthLayout title="Créez votre compte" intro="Gratuit. Un e-mail de vérification vous sera envoyé.">
      <RegisterForm />
    </AuthLayout>
  );
}
