import { faBookOpen } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { StudioTopbar } from "@/components/studio/studio-shell";
import { CourseTile, EmptyState, StatusBadge, StudioMain } from "@/components/studio/ui";
import type { CourseStatus } from "@/generated/prisma/client";
import { OwnerOnly } from "@/components/studio/owner-only";
import { listStudioCourses } from "@/server/courses/courses.service";
import { COURSE_STATUSES } from "@/shared/courses";
import { formatDate, formatPrice, plural } from "@/shared/format";

export const metadata: Metadata = { title: "Mes cours" };

const TABS: { status?: CourseStatus; label: string }[] = [
  { label: "Tous" },
  { status: "PUBLISHED", label: "Publiés" },
  { status: "SCHEDULED", label: "Programmés" },
  { status: "DRAFT", label: "Brouillons" },
  { status: "ARCHIVED", label: "Archivés" },
];

async function CourseList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const raw = (await searchParams).status;
  const status = (COURSE_STATUSES as readonly string[]).includes(String(raw)) ? (raw as CourseStatus) : undefined;
  const { courses, counts } = await listStudioCourses(status);

  return (
    <>
      <nav aria-label="Filtrer par statut" className="flex gap-2 overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const active = tab.status === status;
          return (
            <Link
              key={tab.label}
              href={tab.status ? `/studio/courses?status=${tab.status}` : "/studio/courses"}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3.5 py-[9px] text-sm font-semibold whitespace-nowrap ${
                active ? "border-forest bg-forest text-white hover:text-white" : "border-line-admin bg-white text-ink hover:border-forest hover:text-ink"
              }`}
            >
              {tab.label} · {counts[tab.status ?? "ALL"]}
            </Link>
          );
        })}
      </nav>

      {courses.length === 0 ? (
        <EmptyState icon={faBookOpen} title={status ? "Aucun cours dans cet onglet" : "Aucun cours pour l'instant"}>
          <Link href="/studio/courses/new" className="font-bold">
            Créer un cours
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-3.5">
          {courses.map((c) => (
            <li key={c.id} className="flex flex-col gap-3.5 rounded-xl border border-line-admin bg-white p-4">
              <div className="flex items-start gap-3.5">
                <CourseTile seed={c.slug} icon={c.categoryIcon} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] leading-[1.35] font-bold tracking-normal text-ink">{c.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {c.status === "SCHEDULED" && c.scheduledAt ? `Publication le ${formatDate(c.scheduledAt)}` : `Modifié le ${formatDate(c.updatedAt)}`}
                    {c.categoryName ? ` · ${c.categoryName}` : " · Sans catégorie"}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <dl className="grid grid-cols-2 gap-2 rounded-md bg-paper p-3 text-center">
                <div>
                  <dt className="sr-only">Leçons</dt>
                  <dd className="text-base font-extrabold text-forest">{c.lessonCount}</dd>
                  <dd className="text-xs text-muted">{c.lessonCount > 1 ? "leçons" : "leçon"}</dd>
                </div>
                <div>
                  <dt className="sr-only">Prix</dt>
                  <dd className="text-base font-extrabold whitespace-nowrap text-forest">{formatPrice(c.price)}</dd>
                  <dd className="text-xs text-muted">prix</dd>
                </div>
              </dl>
              <div className="flex justify-end">
                <Link
                  href={`/studio/courses/${c.id}/programme`}
                  className="flex h-10 items-center rounded-[11px] bg-forest px-4 text-sm font-bold text-white hover:bg-forest-900 hover:text-white"
                >
                  Modifier<span className="sr-only"> : {c.title}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" role="status">
        {plural(courses.length, "cours", "cours")}
      </p>
    </>
  );
}

export default function StudioCoursesPage(props: PageProps<"/studio/courses">) {
  return (
    <>
      <StudioTopbar title="Mes cours" />
      <StudioMain>
        <Suspense fallback={<p className="text-muted">Chargement des cours…</p>}>
          <OwnerOnly>
            <CourseList searchParams={props.searchParams} />
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
