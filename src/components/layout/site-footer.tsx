import Link from "next/link";

import { Logo } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-sand">
      <div className="mx-auto flex max-w-site flex-wrap justify-between gap-8 px-5 py-10">
        <div className="max-w-[340px] flex-[1_1_260px]">
          <div className="mb-3">
            <Logo size="sm" />
          </div>
          <p className="text-sm leading-relaxed text-ink-700">Des cours de numérique clairs et complets, conçus à Conakry.</p>
        </div>
        <div className="flex flex-wrap gap-10 text-sm">
          <nav aria-label="Plateforme" className="flex flex-col gap-2.5">
            <strong className="text-ink">Plateforme</strong>
            <Link href="/courses">Catalogue</Link>
            <Link href="/certificates">Vérifier un certificat</Link>
            <Link href="/about">À propos du formateur</Link>
          </nav>
          <nav aria-label="Aide" className="flex flex-col gap-2.5">
            <strong className="text-ink">Aide</strong>
            <a href="mailto:bayo.ibrahima@doztra.com">Contact</a>
            <Link href="/credits">Crédits photos</Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-site border-t border-[#E3D6C2] px-5 pt-4 pb-7 text-[13px] text-muted">
        © 2026 Doztra SARL · Tous droits réservés
      </div>
    </footer>
  );
}
