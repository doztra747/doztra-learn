import { faEye } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowDown,
  faArrowUp,
  faEyeSlash,
  faPen,
  faPlus,
  faTrashCan,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import {
  addLessonAction,
  addSectionAction,
  deleteLessonAction,
  deleteSectionAction,
  moveLessonAction,
  moveSectionAction,
  renameLessonAction,
  renameSectionAction,
  toggleFreePreviewAction,
} from "@/app/studio/actions";
import { Icon, LESSON_TYPE_ICONS } from "@/components/icon";
import { ActionButton, StudioForm, SubmitButton, TextField } from "@/components/studio/form";
import { lessonReadiness, type EditorCourse } from "@/server/courses/courses.service";
import { LESSON_TYPE_NAMES, LESSON_TYPES } from "@/shared/courses";

const iconButton =
  "grid size-[34px] place-items-center rounded-sm border border-line-admin bg-white text-ink-700 hover:border-forest hover:text-forest";

/** Formulaire caché derrière un bouton (renommer, confirmer une suppression) : <details> natif, sans JavaScript. */
function Disclosure({ label, icon, children }: { label: string; icon: typeof faPen; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className={`${iconButton} cursor-pointer list-none [&::-webkit-details-marker]:hidden`} aria-label={label} title={label}>
        <Icon icon={icon} />
      </summary>
      <div className="absolute right-3 left-3 z-10 mt-2 rounded-md border border-line-admin bg-white p-3 shadow-card sm:left-auto sm:w-[340px]">{children}</div>
    </details>
  );
}

function LessonRow({ lesson, editable }: { lesson: EditorCourse["sections"][number]["lessons"][number]; editable: boolean }) {
  const readiness = lessonReadiness(lesson);
  return (
    <li className="relative flex flex-wrap items-center gap-3 border-t border-inline-code px-4 py-3">
      <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-mint text-forest">
        <Icon icon={LESSON_TYPE_ICONS[lesson.type]} />
      </span>
      <div className="min-w-0 flex-[1_1_180px]">
        <p className="text-sm font-semibold text-ink">{lesson.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
          {LESSON_TYPE_NAMES[lesson.type]}
          {lesson.isFreePreview ? <span className="rounded-full bg-warning-bg px-2 py-0.5 font-bold text-warning">Aperçu gratuit</span> : null}
          {!readiness.ok ? (
            <span className="rounded-full bg-danger-bg px-2 py-0.5 font-bold text-danger">
              <Icon icon={faTriangleExclamation} /> Non publiable · {readiness.reason}
            </span>
          ) : null}
        </p>
      </div>
      {editable ? (
        <div className="flex flex-wrap items-center gap-1">
          <ActionButton action={moveLessonAction.bind(null, lesson.id)} name="direction" value="up" label={`Monter « ${lesson.title} »`} className={iconButton}>
            <Icon icon={faArrowUp} />
          </ActionButton>
          <ActionButton action={moveLessonAction.bind(null, lesson.id)} name="direction" value="down" label={`Descendre « ${lesson.title} »`} className={iconButton}>
            <Icon icon={faArrowDown} />
          </ActionButton>
          <ActionButton
            action={toggleFreePreviewAction.bind(null, lesson.id)}
            label={lesson.isFreePreview ? `Retirer l'aperçu gratuit de « ${lesson.title} »` : `Mettre « ${lesson.title} » en aperçu gratuit`}
            className={iconButton}
          >
            <Icon icon={lesson.isFreePreview ? faEyeSlash : faEye} />
          </ActionButton>
          <Disclosure label={`Renommer « ${lesson.title} »`} icon={faPen}>
            <StudioForm key={lesson.title} action={renameLessonAction.bind(null, lesson.id)} className="flex flex-col gap-2">
              <TextField name="title" label="Titre de la leçon" defaultValue={lesson.title} maxLength={160} required />
              <SubmitButton className="self-start">Renommer</SubmitButton>
            </StudioForm>
          </Disclosure>
          <Disclosure label={`Supprimer « ${lesson.title} »`} icon={faTrashCan}>
            <p className="mb-2 text-sm text-ink">Supprimer définitivement la leçon « {lesson.title} » ?</p>
            <div className="flex flex-wrap gap-2">
              <ActionButton action={deleteLessonAction.bind(null, lesson.id)} className="rounded-base bg-danger px-3.5 py-2.5 text-sm font-bold text-white">
                Supprimer la leçon
              </ActionButton>
            </div>
          </Disclosure>
        </div>
      ) : null}
    </li>
  );
}

function AddLessonForm({ sectionId, sectionTitle }: { sectionId: string; sectionTitle: string }) {
  return (
    <StudioForm resetOnSuccess action={addLessonAction.bind(null, sectionId)} className="flex flex-col gap-2 border-t border-dashed border-line-admin px-4 py-3" aria-label={`Ajouter une leçon à « ${sectionTitle} »`}>
      <TextField name="title" label="Nouvelle leçon" placeholder="Titre de la leçon" maxLength={160} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Type de la leçon à ajouter">
        {LESSON_TYPES.map((type) => (
          <SubmitButton
            key={type}
            name="type"
            value={type}
            variant="secondary"
            className="border-dashed border-[#C9BCA8] px-3 py-2 text-[13px] font-semibold"
          >
            <Icon icon={LESSON_TYPE_ICONS[type]} /> {LESSON_TYPE_NAMES[type]}
          </SubmitButton>
        ))}
      </div>
    </StudioForm>
  );
}

/** Onglet Programme : sections et leçons du cours (F-21). */
export function ProgramEditor({ course }: { course: EditorCourse }) {
  const editable = course.status === "DRAFT" || course.status === "ARCHIVED";
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      {!editable ? (
        <p className="rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">
          Ce cours est publié : son programme ne peut pas être modifié directement pour l&apos;instant. Archivez-le pour le modifier.
        </p>
      ) : null}
      {course.sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#C9BCA8] bg-paper px-5 py-8 text-center text-sm text-muted">
          Aucune section. Commencez par ajouter une section, puis ses leçons.
        </p>
      ) : null}
      {course.sections.map((section, index) => (
        <section key={section.id} aria-labelledby={`section-${section.id}`} className="relative rounded-xl border border-line-admin bg-white">
          <div className="flex flex-wrap items-center gap-3 rounded-t-xl border-b border-[#EFE7DA] bg-paper px-4 py-3.5">
            <span className="text-xs font-bold text-terracotta-700">SECTION {index + 1}</span>
            <h3 id={`section-${section.id}`} className="min-w-0 flex-1 text-[15px] font-bold tracking-normal text-ink">
              {section.title}
            </h3>
            <span className="text-[13px] text-muted">{section.lessons.length} {section.lessons.length > 1 ? "leçons" : "leçon"}</span>
            {editable ? (
              <div className="flex flex-wrap gap-1">
                <ActionButton action={moveSectionAction.bind(null, section.id)} name="direction" value="up" label={`Monter la section « ${section.title} »`} className={iconButton}>
                  <Icon icon={faArrowUp} />
                </ActionButton>
                <ActionButton action={moveSectionAction.bind(null, section.id)} name="direction" value="down" label={`Descendre la section « ${section.title} »`} className={iconButton}>
                  <Icon icon={faArrowDown} />
                </ActionButton>
                <Disclosure label={`Renommer la section « ${section.title} »`} icon={faPen}>
                  <StudioForm key={section.title} action={renameSectionAction.bind(null, section.id)} className="flex flex-col gap-2">
                    <TextField name="title" label="Titre de la section" defaultValue={section.title} maxLength={160} required />
                    <SubmitButton className="self-start">Renommer</SubmitButton>
                  </StudioForm>
                </Disclosure>
                <Disclosure label={`Supprimer la section « ${section.title} »`} icon={faTrashCan}>
                  <p className="mb-2 text-sm text-ink">
                    Supprimer la section « {section.title} » et ses {section.lessons.length} leçon(s) ?
                  </p>
                  <ActionButton action={deleteSectionAction.bind(null, section.id)} className="rounded-base bg-danger px-3.5 py-2.5 text-sm font-bold text-white">
                    Supprimer la section
                  </ActionButton>
                </Disclosure>
              </div>
            ) : null}
          </div>
          <ul>
            {section.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} editable={editable} />
            ))}
          </ul>
          {editable ? <AddLessonForm sectionId={section.id} sectionTitle={section.title} /> : null}
        </section>
      ))}
      {editable ? (
        <StudioForm
          resetOnSuccess
          action={addSectionAction.bind(null, course.id)}
          className="flex flex-wrap items-end gap-2 rounded-[18px] border-[1.5px] border-dashed border-[#C9BCA8] p-4"
          aria-label="Ajouter une section"
        >
          <TextField name="title" label="Nouvelle section" placeholder="Prise en main" maxLength={160} className="min-w-[200px] flex-1" />
          <SubmitButton>
            <Icon icon={faPlus} /> Ajouter une section
          </SubmitButton>
        </StudioForm>
      ) : null}
    </div>
  );
}
