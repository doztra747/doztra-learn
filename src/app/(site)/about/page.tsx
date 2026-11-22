import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles, PHOTOS, PhotoImage } from "@/components/ui";
import { TRAINER } from "@/server/site";

export const metadata: Metadata = { title: "À propos du formateur" };

/** À propos du formateur (prototype : section formateur de l'accueil). Contenu éditable dans les paramètres du site (phase 1). */
export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-site flex-wrap items-center gap-[clamp(28px,5vw,56px)] px-5 py-[clamp(48px,7vw,88px)]">
      <div className="relative aspect-square min-w-[240px] flex-[0_1_320px] overflow-hidden rounded-[28px] bg-sand">
        <PhotoImage photo={PHOTOS.accueilCode} priority />
      </div>
      <div className="min-w-0 flex-[1_1_360px]">
        <span className="text-[13px] font-bold tracking-[.08em] text-terracotta-700 uppercase">Votre formateur</span>
        <h1 className="mt-2.5 mb-1.5 text-[clamp(28px,4vw,40px)] tracking-[-.03em]">{TRAINER.name}</h1>
        <p className="mb-[18px] font-semibold text-muted">{TRAINER.role}</p>
        <p className="mb-6 max-w-[560px] text-base leading-[1.7] text-pretty text-ink-700">{TRAINER.bio}</p>
        <Link href="/courses" className={`${buttonStyles.ghost} border-forest py-[13px]`}>
          Voir tous ses cours
        </Link>
      </div>
    </main>
  );
}
