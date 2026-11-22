import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import { Suspense } from "react";

import { StudioTopbar } from "@/components/studio/studio-shell";
import { EmptyState, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";

export const metadata: Metadata = { title: "Import vidéo" };

/** Écran du prototype « video » ; branché avec le pipeline médias (phase 5). */
export default function Page() {
  return (
    <>
      <StudioTopbar title="Import vidéo" />
      <StudioMain>
        <Suspense fallback={null}>
          <OwnerOnly>
            <EmptyState icon={faCloudArrowUp} title="Bientôt disponible">
              L&apos;import reprenable des vidéos et des PDF, le transcodage et le choix de la miniature arrivent avec la gestion des médias.
            </EmptyState>
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
