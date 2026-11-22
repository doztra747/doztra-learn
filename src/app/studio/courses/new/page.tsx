import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { NewCourseForm } from "@/components/studio/course-forms";
import { StudioTopbar } from "@/components/studio/studio-shell";
import { Panel, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";
import { listCategories } from "@/server/categories/categories.service";

export const metadata: Metadata = { title: "Nouveau cours" };

async function Form() {
  await connection();
  const categories = await listCategories();
  return <NewCourseForm categories={categories.map((c) => ({ value: c.id, label: c.parentName ? `${c.parentName} › ${c.name}` : c.name }))} />;
}

export default function NewCoursePage() {
  return (
    <>
      <StudioTopbar title="Nouveau cours" />
      <StudioMain>
        <Panel className="max-w-[720px]">
          <p className="mb-4 text-sm text-muted">Le cours est créé en brouillon. Vous compléterez ensuite les informations, le programme et le prix.</p>
          <Suspense fallback={<p className="text-muted">Chargement…</p>}>
            <OwnerOnly>
              <Form />
            </OwnerOnly>
          </Suspense>
        </Panel>
      </StudioMain>
    </>
  );
}
