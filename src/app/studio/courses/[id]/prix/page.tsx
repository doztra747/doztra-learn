import type { Metadata } from "next";
import { Suspense } from "react";

import { CourseEditorHeader } from "@/components/studio/course-editor-header";
import { CoursePricingForm } from "@/components/studio/course-forms";
import { StudioTopbar } from "@/components/studio/studio-shell";
import { StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";

import { loadEditorCourse } from "../load";

export const metadata: Metadata = { title: "Prix du cours" };

const gnf = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 });

async function Pricing({ params }: { params: Promise<{ id: string }> }) {
  const course = await loadEditorCourse(params);
  return (
    <>
      <CourseEditorHeader course={course} active="prix" />
      <CoursePricingForm
        courseId={course.id}
        price={course.price === BigInt(0) ? "0" : gnf.format(course.price)}
        compareAtPrice={course.compareAtPrice === null ? "" : gnf.format(course.compareAtPrice)}
      />
    </>
  );
}

export default function CoursePricingPage(props: PageProps<"/studio/courses/[id]/prix">) {
  return (
    <>
      <StudioTopbar title="Éditeur de cours" />
      <StudioMain>
        <Suspense fallback={<p className="text-muted">Chargement du cours…</p>}>
          <OwnerOnly>
            <Pricing params={props.params} />
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
