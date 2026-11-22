import { redirect } from "next/navigation";
import { Suspense } from "react";

import { OwnerOnly } from "@/components/studio/owner-only";

async function RedirectToProgram({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/studio/courses/${encodeURIComponent((await params).id)}/programme`);
  return null;
}

/** L'éditeur s'ouvre sur l'onglet Programme (prototype). */
export default function CourseEditorIndex(props: PageProps<"/studio/courses/[id]">) {
  return (
    <Suspense fallback={null}>
      <OwnerOnly>
        <RedirectToProgram params={props.params} />
      </OwnerOnly>
    </Suspense>
  );
}
