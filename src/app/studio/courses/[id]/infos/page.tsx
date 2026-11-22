import { faImage } from "@fortawesome/free-regular-svg-icons";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Icon } from "@/components/icon";
import { CourseEditorHeader } from "@/components/studio/course-editor-header";
import { CourseInfoForm } from "@/components/studio/course-forms";
import { StudioTopbar } from "@/components/studio/studio-shell";
import { Panel, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";
import { listCategories } from "@/server/categories/categories.service";
import { tiptapToText } from "@/shared/courses";

import { loadEditorCourse } from "../load";

export const metadata: Metadata = { title: "Informations du cours" };

async function Infos({ params }: { params: Promise<{ id: string }> }) {
  const [course, categories] = await Promise.all([loadEditorCourse(params), listCategories()]);
  return (
    <>
      <CourseEditorHeader course={course} active="infos" />
      <div className="flex flex-wrap items-start gap-4">
        <Panel className="min-w-0 flex-[3_1_480px]" aria-label="Informations du cours">
          <CourseInfoForm
            courseId={course.id}
            slug={course.slug}
            slugLocked={!!course.publishedAt}
            categories={categories.map((c) => ({ value: c.id, label: c.parentName ? `${c.parentName} › ${c.name}` : c.name }))}
            values={{
              title: course.title,
              subtitle: course.subtitle ?? "",
              categoryId: course.categoryId ?? "",
              level: course.level,
              description: tiptapToText(course.description),
              objectives: course.objectives.filter((o) => o.kind === "OBJECTIVE").map((o) => o.text).join("\n"),
              prerequisites: course.objectives.filter((o) => o.kind === "PREREQUISITE").map((o) => o.text).join("\n"),
            }}
          />
        </Panel>
        <Panel as="aside" className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5" aria-labelledby="titre-couverture">
          <h3 id="titre-couverture" className="text-sm font-bold tracking-normal text-ink">
            Image de couverture
          </h3>
          <div className="grid aspect-video place-items-center rounded-md border-2 border-dashed border-[#C9BCA8] bg-sand text-center text-muted">
            <span className="flex flex-col items-center gap-2 px-4 text-[13px]">
              <Icon icon={faImage} className="text-2xl text-forest" />
              Import disponible avec la gestion des médias
            </span>
          </div>
          <span className="text-xs text-muted">JPG, PNG ou WEBP · 10 Mo max · 1280×720 recommandé. Obligatoire pour publier.</span>
        </Panel>
      </div>
    </>
  );
}

export default function CourseInfosPage(props: PageProps<"/studio/courses/[id]/infos">) {
  return (
    <>
      <StudioTopbar title="Éditeur de cours" />
      <StudioMain>
        <Suspense fallback={<p className="text-muted">Chargement du cours…</p>}>
          <OwnerOnly>
            <Infos params={props.params} />
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
