import { faAward } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "@/components/icon";

/** Aperçu visuel d'un certificat (prototype « mine », onglet Certificats). */
export function CertificatePreview({ fullName, courseTitle }: { fullName: string; courseTitle: string }) {
  return (
    <div className="flex aspect-[1.414] flex-col items-center justify-center gap-1.5 rounded-md border-[6px] border-forest bg-sand p-3.5 text-center">
      <Icon icon={faAward} className="text-[26px] text-terracotta" />
      <span className="text-[11px] font-bold tracking-[.14em] text-forest">CERTIFICAT DE RÉUSSITE</span>
      <span className="text-lg font-extrabold text-forest">{fullName}</span>
      <span className="text-xs text-ink-700">{courseTitle}</span>
    </div>
  );
}
