import { faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import { Suspense } from "react";

import { StudioTopbar } from "@/components/studio/studio-shell";
import { EmptyState, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";

export const metadata: Metadata = { title: "Apprenants" };

/** Écran du prototype « students » ; branché avec les comptes et inscriptions (phases 3 et 6). */
export default function Page() {
  return (
    <>
      <StudioTopbar title="Apprenants" />
      <StudioMain>
        <Suspense fallback={null}>
          <OwnerOnly>
            <EmptyState icon={faUserGraduate} title="Aucun apprenant pour l'instant">
              La liste des apprenants, leur progression et leurs achats apparaîtront ici dès les premières inscriptions.
            </EmptyState>
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
