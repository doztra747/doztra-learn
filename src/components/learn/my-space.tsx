import { faCode, faPlay } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { Icon } from "@/components/icon";
import { ProgressBar } from "@/components/ui";
import { CERTIFICATES, DEMO_ENROLLMENTS, DEMO_LEARNER } from "@/server/demo/data";

export type MySpaceTab = "progress" | "done" | "certs";

/** Gabarit de l'espace « Mes cours » (prototype « mine ») : salutation, reprise, onglets. */
export function MySpace({ tab, children }: { tab: MySpaceTab; children: React.ReactNode }) {
  const counts = {
    progress: DEMO_ENROLLMENTS.filter((e) => e.status === "progress").length,
    done: DEMO_ENROLLMENTS.filter((e) => e.status === "done").length,
    certs: CERTIFICATES.length,
  };
  const tabs: { id: MySpaceTab; label: string; href: string }[] = [
    { id: "progress", label: "En cours", href: "/my-courses" },
    { id: "done", label: "Terminés", href: "/my-courses?tab=done" },
    { id: "certs", label: "Certificats", href: "/my-certificates" },
  ];

  return (
    <>
      <main className="mx-auto flex w-full max-w-site flex-col gap-7 px-5 pt-[clamp(24px,4vw,48px)] pb-[72px]">
        <div>
          <h1 className="mb-1.5 text-[clamp(28px,4vw,40px)] tracking-[-.03em]">Bonjour {DEMO_LEARNER.firstName}</h1>
          <p className="text-base text-muted">Reprenez là où vous vous êtes arrêtée.</p>
        </div>

        <section aria-label="Dernière leçon" className="flex flex-wrap items-center gap-5 rounded-[26px] bg-forest p-[clamp(20px,4vw,32px)] text-sand">
          <span className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-gold text-[26px] text-forest">
            <Icon icon={faCode} />
          </span>
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="text-[13px] font-bold tracking-[.06em] text-gold uppercase">Dernière leçon</p>
            <p className="my-1 text-xl font-bold text-white">Variables et types</p>
            <p className="text-sm text-[#C9D8D4]">JavaScript moderne : de zéro à l&apos;autonomie</p>
            <div className="mt-3 flex max-w-[360px] items-center gap-2.5">
              <ProgressBar value={22} label="Progression du cours : 22 %" tone="dark" />
              <span className="text-[13px] font-bold">22 %</span>
            </div>
          </div>
          <Link
            href="/learn/javascript-moderne/l3"
            className="flex items-center gap-2.5 rounded-full bg-gold px-[22px] py-[15px] text-[15px] font-bold text-forest hover:bg-gold-600 hover:text-forest"
          >
            <Icon icon={faPlay} />
            Reprendre
          </Link>
        </section>

        <nav aria-label="Mes cours" className="flex max-w-full gap-1.5 self-start overflow-x-auto rounded-full border border-line bg-white p-[5px]">
          {tabs.map((t) => {
            const active = t.id === tab;
            return (
              <Link
                key={t.id}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ${
                  active ? "bg-forest text-white hover:text-white" : "text-ink hover:text-ink"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-xs text-ink ${active ? "bg-gold" : "bg-[#EFE7DA]"}`}>{counts[t.id]}</span>
              </Link>
            );
          })}
        </nav>

        {children}
      </main>
      <SiteFooter />
    </>
  );
}
