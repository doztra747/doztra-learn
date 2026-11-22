import { SiteHeader } from "@/components/layout/site-header";
import { DEMO_LEARNER } from "@/server/demo/data";

/**
 * Espace apprenant. Démonstration : apprenant fictif.
 * Phase 3 : chaque page appellera requireUser() (la DAL), ce layout ne protège rien à lui seul.
 */
export default function LearnLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader user={DEMO_LEARNER} />
      <div id="contenu" className="flex flex-1 flex-col">
        {children}
      </div>
    </>
  );
}
