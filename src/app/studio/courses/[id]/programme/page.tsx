import type { Metadata } from "next";
import { Suspense } from "react";

import { CourseEditorHeader } from "@/components/studio/course-editor-header";
import { ProgramEditor } from "@/components/studio/program-editor";
import { PublishChecklist } from "@/components/studio/publish-checklist";
import { StudioTopbar } from "@/components/studio/studio-shell";
import { StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";
import { getPublishChecklist } from "@/server/courses/courses.service";

import { loadEditorCourse } from "../load";

export const metadata: Metadata = { title: "Programme du cours" };

async function Program({ params }: { params: Promise<{ id: string }> }) {
  const course = await loadEditorCourse(params);
  return (
    <>
      <CourseEditorHeader course={course} active="programme" />
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-[3_1_520px]">
          <ProgramEditor course={course} />
        </div>
        <div className="min-w-0 flex-[1_1_280px]">
          <PublishChecklist items={getPublishChecklist(course)} />
        </div>
      </div>
    </>
  );
}

export default function CourseProgramPage(props: PageProps<"/studio/courses/[id]/programme">) {
  return (
    <>
      <StudioTopbar title="Éditeur de cours" />
      <StudioMain>
        <Suspense fallback={<p className="text-muted">Chargement du programme…</p>}>
          <OwnerOnly>
            <Program params={props.params} />
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
