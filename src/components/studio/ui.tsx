import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { CATEGORY_ICON_DEFS, Icon } from "@/components/icon";
import { courseTone, toneFor } from "@/components/ui";
import { type CategoryIcon, CATEGORY_ICONS, type CourseStatusValue, STATUS_LABELS } from "@/shared/courses";

/** Contenu principal d'une page du studio (largeur max 1360 px, marges du prototype). */
export function StudioMain({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <main id="contenu" className={`flex w-full max-w-[1360px] flex-col gap-5 p-[clamp(16px,3vw,32px)] ${className}`}>
      {children}
    </main>
  );
}

/** Carte blanche du studio (rayon 20 px, bordure line-admin). */
export function Panel({ children, className = "", as: Tag = "section", ...rest }: { children: React.ReactNode; className?: string; as?: "section" | "div" | "aside" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`rounded-xl border border-line-admin bg-white p-5 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

const STATUS_STYLES: Record<CourseStatusValue, string> = {
  PUBLISHED: "bg-success-bg text-success-dark",
  SCHEDULED: "bg-warning-bg text-warning",
  DRAFT: "bg-[#EFE7DA] text-ink-700",
  ARCHIVED: "bg-[#ECEEEE] text-muted",
};

/** Pastille de statut d'un cours (couleur + texte, jamais la couleur seule). */
export function StatusBadge({ status }: { status: CourseStatusValue }) {
  return <span className={`shrink-0 rounded-full px-2.5 py-[5px] text-xs font-bold ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

const asCategoryIcon = (icon?: string | null): CategoryIcon =>
  icon && (CATEGORY_ICONS as readonly string[]).includes(icon) ? (icon as CategoryIcon) : "fa-solid fa-book-open";

/** Vignette d'un cours sans couverture : icône de sa catégorie sur une couleur stable. */
export function CourseTile({ seed, icon, size = "md" }: { seed: string; icon?: string | null; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-[42px] rounded-base" : "size-[52px] rounded-[15px] text-xl";
  return (
    <span className={`grid shrink-0 place-items-center ${box} ${courseTone(toneFor(seed))}`}>
      <Icon icon={CATEGORY_ICON_DEFS[asCategoryIcon(icon)]} />
    </span>
  );
}

/** État vide explicite (données qui n'existent pas encore). */
export function EmptyState({ icon, title, children }: { icon: IconDefinition; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-[#C9BCA8] bg-paper px-5 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-lg bg-mint text-xl text-forest">
        <Icon icon={icon} />
      </span>
      <h2 className="text-base tracking-normal text-ink">{title}</h2>
      <div className="max-w-[460px] text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}

/** Indicateur chiffré (carte KPI du tableau de bord). */
export function StatCard({ label, value, hint, icon, tint }: { label: string; value: string; hint: string; icon: IconDefinition; tint: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line-admin bg-white p-[18px]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className={`grid size-9 place-items-center rounded-[11px] ${tint}`}>
          <Icon icon={icon} />
        </span>
      </div>
      <p className="text-[clamp(22px,2.6vw,28px)] font-extrabold tracking-tight text-forest">{value}</p>
      <p className="text-[13px] font-semibold text-muted">{hint}</p>
    </div>
  );
}
