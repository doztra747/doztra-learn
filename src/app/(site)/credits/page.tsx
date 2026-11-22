import type { Metadata } from "next";

import { PHOTO_CREDITS } from "@/shared/credits";

export const metadata: Metadata = { title: "Crédits photos" };

/** Mentions exigées par les licences Creative Commons des photos du site. */
export default function CreditsPage() {
  return (
    <main className="mx-auto w-full max-w-read px-5 py-[clamp(32px,6vw,72px)]">
      <h1 className="mb-2 text-[clamp(28px,4vw,40px)] tracking-[-.03em]">Crédits photos</h1>
      <p className="mb-8 text-base text-muted">
        Les photos du site sont publiées sous licence Creative Commons. Elles ont été recadrées et converties au format WebP.
      </p>
      <ul className="flex flex-col gap-4">
        {PHOTO_CREDITS.map((c) => (
          <li key={c.fichier} className="rounded-2xl border border-line bg-white p-5 text-[15px] leading-relaxed text-ink-700">
            <p className="mb-1 text-xs font-bold tracking-[.06em] text-terracotta-700 uppercase">{c.usage}</p>
            <p>
              « {c.titre} » par <strong className="text-ink">{c.auteur}</strong>, sous licence{" "}
              <a href={c.licenceUrl} rel="noopener noreferrer nofollow license" target="_blank" className="font-semibold underline">
                {c.licence}
              </a>
              .{" "}
              <a href={c.source} rel="noopener noreferrer nofollow" target="_blank" className="underline">
                Voir l&apos;original
              </a>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
