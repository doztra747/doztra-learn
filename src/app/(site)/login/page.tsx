import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PHOTOS } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/dal";
import { safeNextPath } from "@/shared/auth";

export const metadata: Metadata = { title: "Connexion" };

async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).next;
  const next = safeNextPath(Array.isArray(raw) ? raw[0] : raw);
  // Déjà connecté : inutile de se reconnecter.
  const user = await getCurrentUser();
  if (user) redirect(next ?? (user.roles.includes("OWNER") ? "/studio" : "/my-courses"));
  return <LoginForm next={next} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthLayout photo={PHOTOS.connexion} title="Bon retour parmi nous" intro="Connectez-vous pour reprendre vos cours là où vous les avez laissés.">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        <Login searchParams={props.searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
