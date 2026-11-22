import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/** Pages publiques : en-tête visiteur (la session arrive en phase 3). */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <div id="contenu" className="flex flex-1 flex-col">
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
