import { requireOwner } from "@/server/auth/dal";

/**
 * Garde d'accès d'une page du studio : vérifie la session et le rôle OWNER à chaque requête
 * (à placer dans un <Suspense>, car il lit les cookies). Le contenu n'est rendu qu'après la vérification.
 */
export async function OwnerOnly({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <>{children}</>;
}
