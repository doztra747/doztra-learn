import { faCloud } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { StatusBadge } from "@/components/studio/ui";
import type { CourseStatusValue } from "@/shared/courses";
import { formatDate } from "@/shared/format";

export type EditorTab = "infos" | "programme" | "prix" | "publication";

const TABS: { id: EditorTab; label: string }[] = [
  { id: "infos", label: "Informations" },
  { id: "programme", label: "Programme" },
  { id: "prix", label: "Prix" },
  { id: "publication", label: "Publication" },
];

/** En-tête de l'éditeur de cours : titre, statut, dernière modification et onglets (prototype « editor »). */
export function CourseEditorHeader({
  course,
  active,
}: {
  course: { id: string; title: string; status: CourseStatusValue; updatedAt: Date };
  active: EditorTab;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg tracking-normal text-ink">{course.title}</h2>
            <StatusBadge status={course.status} />
          </div>
          <p className="mt-1 text-[13px] text-muted">
            <Icon icon={faCloud} /> Enregistré le {formatDate(course.updatedAt)} · chaque modification est enregistrée en base
          </p>
        </div>
      </div>
      <nav aria-label="Sections de l'éditeur" className="flex gap-1 overflow-x-auto border-b border-line-admin">
        {TABS.map((tab) => {
          const current = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={`/studio/courses/${course.id}/${tab.id}`}
              aria-current={current ? "page" : undefined}
              className={`shrink-0 border-b-[3px] px-3.5 py-3 text-[15px] ${
                current ? "border-terracotta font-bold text-forest hover:text-forest" : "border-transparent font-semibold text-muted hover:text-forest"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
