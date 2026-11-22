import type { Metadata } from "next";

import { StudioShell } from "@/components/studio/studio-shell";

export const metadata: Metadata = {
  title: { default: "Espace formateur", template: "%s · Espace formateur · Doztra-Learn" },
  robots: { index: false, follow: false },
};

/**
 * Coquille du studio. Elle NE protège rien : chaque page enveloppe son contenu dans <OwnerOnly> et chaque
 * Server Action appelle requireOwner() ; proxy.ts ne fait qu'une redirection optimiste vers /login.
 */
export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return <StudioShell>{children}</StudioShell>;
}
