import { faComments } from "@fortawesome/free-regular-svg-icons";
import type { Metadata } from "next";
import { Suspense } from "react";

import { StudioTopbar } from "@/components/studio/studio-shell";
import { EmptyState, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";

export const metadata: Metadata = { title: "Questions et avis" };

/** Écran du prototype « questions » ; branché avec la communauté (phase 7). */
export default function Page() {
  return (
    <>
      <StudioTopbar title="Questions et avis" />
      <StudioMain>
        <Suspense fallback={null}>
          <OwnerOnly>
            <EmptyState icon={faComments} title="Aucune question ni aucun avis">
              Les questions posées sous les leçons et les avis sur vos cours apparaîtront ici.
            </EmptyState>
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
