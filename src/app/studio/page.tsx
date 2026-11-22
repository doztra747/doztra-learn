import { faComments, faFileLines } from "@fortawesome/free-regular-svg-icons";
import { faBookOpen, faChartLine, faCircleCheck, faLayerGroup, faPenRuler } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { StudioTopbar } from "@/components/studio/studio-shell";
import { CourseTile, EmptyState, Panel, StatCard, StatusBadge, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";
import { getContentStats, listStudioCourses } from "@/server/courses/courses.service";
import { formatDate, plural } from "@/shared/format";

export const metadata: Metadata = { title: "Tableau de bord" };

async function Dashboard() {
  await connection(); // données lues à chaque requête
  const [stats, { courses }] = await Promise.all([getContentStats(), listStudioCourses()]);
  const recent = courses.slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
        <StatCard label="Cours publiés" value={String(stats.published)} hint={plural(stats.archived, "archivé")} icon={faCircleCheck} tint="bg-success-bg text-success" />
        <StatCard label="Brouillons" value={String(stats.drafts)} hint={stats.scheduled ? plural(stats.scheduled, "programmé") : "En cours de rédaction"} icon={faPenRuler} tint="bg-warning-bg text-warning" />
        <StatCard label="Leçons" value={String(stats.lessons)} hint={plural(stats.sections, "section")} icon={faFileLines} tint="bg-mint text-forest" />
        <StatCard label="Catégories" value={String(stats.categories)} hint="Arborescence à 2 niveaux" icon={faLayerGroup} tint="bg-danger-bg text-terracotta-700" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <Panel aria-labelledby="titre-recents">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="titre-recents" className="text-[17px] tracking-normal text-ink">
              Derniers cours modifiés
            </h2>
            <Link href="/studio/courses" className="text-sm font-bold text-terracotta-700 hover:text-forest">
              Tous les cours
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={faBookOpen} title="Aucun cours pour l'instant">
              <Link href="/studio/courses/new" className="font-bold">
                Créez votre premier cours
              </Link>{" "}
              : titre, catégorie et niveau suffisent pour commencer.
            </EmptyState>
          ) : (
            <ul>
              {recent.map((c) => (
                <li key={c.id} className="flex items-center gap-3 border-t border-inline-code py-3 first:border-t-0">
                  <CourseTile seed={c.slug} icon={c.categoryIcon} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/studio/courses/${c.id}/programme`} className="block truncate text-sm font-bold text-ink">
                      {c.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {plural(c.lessonCount, "leçon")} · modifié le {formatDate(c.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel aria-labelledby="titre-revenus">
          <h2 id="titre-revenus" className="mb-3 text-[17px] tracking-normal text-ink">
            Revenus et apprenants
          </h2>
          <EmptyState icon={faChartLine} title="Pas encore de données">
            Les inscrits, les revenus, le taux de complétion et les abandons par leçon s&apos;afficheront ici dès les premières inscriptions et les premiers paiements.
          </EmptyState>
        </Panel>
      </div>

      <Panel aria-labelledby="titre-questions">
        <h2 id="titre-questions" className="mb-3 text-[17px] tracking-normal text-ink">
          Questions sans réponse
        </h2>
        <EmptyState icon={faComments} title="Aucune question">
          Les questions posées sous les leçons apparaîtront ici.
        </EmptyState>
      </Panel>
    </>
  );
}

export default function StudioDashboardPage() {
  return (
    <>
      <StudioTopbar title="Tableau de bord" />
      <StudioMain>
        <Suspense fallback={<p className="text-muted">Chargement du tableau de bord…</p>}>
          <OwnerOnly>
            <Dashboard />
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
