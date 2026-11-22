import { faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import { Suspense } from "react";

import { StudioTopbar } from "@/components/studio/studio-shell";
import { EmptyState, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";

export const metadata: Metadata = { title: "Paiements et coupons" };

/** Écran du prototype « payments » ; branché avec le paiement (phase 7). */
export default function Page() {
  return (
    <>
      <StudioTopbar title="Paiements et coupons" />
      <StudioMain>
        <Suspense fallback={null}>
          <OwnerOnly>
            <EmptyState icon={faMobileScreenButton} title="Aucune commande pour l'instant">
              Les commandes Orange Money, MTN MoMo et carte, les remboursements et les coupons apparaîtront ici.
            </EmptyState>
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
