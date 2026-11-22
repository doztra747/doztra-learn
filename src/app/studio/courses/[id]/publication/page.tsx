import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faBoxArchive, faCircleDot, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import { Suspense } from "react";

import { archiveCourseAction, deleteCourseAction, publishCourseAction } from "@/app/studio/actions";
import { Icon } from "@/components/icon";
import { CourseEditorHeader } from "@/components/studio/course-editor-header";
import { StudioForm, SubmitButton } from "@/components/studio/form";
import { StudioTopbar } from "@/components/studio/studio-shell";
import { Panel, StudioMain } from "@/components/studio/ui";
import { OwnerOnly } from "@/components/studio/owner-only";

import { loadEditorCourse } from "../load";

export const metadata: Metadata = { title: "Publication du cours" };

async function Publication({ params }: { params: Promise<{ id: string }> }) {
  const course = await loadEditorCourse(params);
  const canPublish = course.status === "DRAFT" || course.status === "ARCHIVED";

  return (
    <>
      <CourseEditorHeader course={course} active="publication" />
      <Panel className="flex max-w-[720px] flex-col gap-3" aria-label="Publication">
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Mode de publication</legend>
          <div className="flex items-center gap-3.5 rounded-md border-[1.5px] border-forest bg-[#F4F8F7] p-3.5">
            <Icon icon={faCircleDot} className="text-lg text-forest" />
            <span>
              <strong className="block text-[15px] text-ink">Publier maintenant</strong>
              <span className="text-[13px] text-muted">Le cours devient visible au catalogue dès sa publication.</span>
            </span>
          </div>
          <div className="flex items-center gap-3.5 rounded-md border-[1.5px] border-line-admin bg-white p-3.5 opacity-70" aria-disabled="true">
            <Icon icon={faCircle} className="text-lg text-[#B5BFBC]" />
            <span>
              <strong className="block text-[15px] text-ink">Programmer</strong>
              <span className="text-[13px] text-muted">Publication automatique à une date choisie (heure de Conakry) — bientôt disponible.</span>
            </span>
          </div>
        </fieldset>

        {canPublish ? (
          <StudioForm action={publishCourseAction.bind(null, course.id)} className="flex flex-col gap-2">
            <SubmitButton className="self-start px-5 py-3.5 text-[15px]">
              {course.status === "ARCHIVED" ? "Republier le cours" : "Publier maintenant"}
            </SubmitButton>
          </StudioForm>
        ) : null}

        {course.status === "PUBLISHED" ? (
          <StudioForm action={archiveCourseAction.bind(null, course.id)} className="flex flex-col gap-2">
            <SubmitButton variant="secondary" className="self-start px-5 py-3.5 text-[15px]">
              <Icon icon={faBoxArchive} /> Archiver le cours
            </SubmitButton>
            <span className="text-[13px] text-muted">Un cours archivé disparaît du catalogue ; les inscrits gardent leur accès.</span>
          </StudioForm>
        ) : null}
      </Panel>

      <Panel className="flex max-w-[720px] flex-col gap-3" aria-labelledby="titre-supprimer">
        <h3 id="titre-supprimer" className="text-[15px] font-bold tracking-normal text-ink">
          Supprimer le cours
        </h3>
        {course.publishedAt ? (
          <p className="text-sm text-muted">Ce cours a déjà été publié : il peut avoir des inscrits. Il peut être archivé mais pas supprimé.</p>
        ) : (
          <StudioForm action={deleteCourseAction.bind(null, course.id)} className="flex flex-col gap-3">
            <p className="text-sm text-muted">Le cours n&apos;a jamais été publié : sa suppression efface aussi ses sections et ses leçons. Cette action est définitive.</p>
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" name="confirm" className="size-[18px] accent-danger" />
              Je confirme vouloir supprimer « {course.title} »
            </label>
            <SubmitButton variant="danger" className="self-start">
              <Icon icon={faTrashCan} /> Supprimer définitivement
            </SubmitButton>
          </StudioForm>
        )}
      </Panel>
    </>
  );
}

export default function CoursePublicationPage(props: PageProps<"/studio/courses/[id]/publication">) {
  return (
    <>
      <StudioTopbar title="Éditeur de cours" />
      <StudioMain>
        <Suspense fallback={<p className="text-muted">Chargement du cours…</p>}>
          <OwnerOnly>
            <Publication params={props.params} />
          </OwnerOnly>
        </Suspense>
      </StudioMain>
    </>
  );
}
