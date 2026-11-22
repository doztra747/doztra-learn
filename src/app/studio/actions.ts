"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fieldErrorsOf, formValues, runAction } from "@/server/actions";
import { requireOwner } from "@/server/auth/dal";
import { createCategory, deleteCategory, updateCategory } from "@/server/categories/categories.service";
import * as courses from "@/server/courses/courses.service";
import { DomainError } from "@/server/errors";
import type { ActionState } from "@/shared/action-state";
import {
  categorySchema,
  courseCreateSchema,
  courseInfoSchema,
  coursePricingSchema,
  idSchema,
  lessonTitleSchema,
  lessonTypeSchema,
  sectionTitleSchema,
} from "@/shared/courses";

/*
 * Server Actions de l'espace formateur. Chacune est un point d'entrée HTTP public :
 * accès vérifié, entrées validées par zod, puis appel du service (qui applique les RG).
 * Accès : requireOwner() (session valide + rôle OWNER), revérifié dans chaque action.
 */

const direction = z.enum(["up", "down"]);

/** Id lié par .bind() : revalidé, car un client peut l'altérer. */
function parseId(id: unknown): string {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) throw new DomainError("INVALID_ID", "Identifiant invalide.", undefined, 400);
  return parsed.data;
}

// --- Cours -----------------------------------------------------------------

export async function createCourseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = courseCreateSchema.safeParse(formValues(formData, ["title", "categoryId", "level"]));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  let id = "";
  const result = await runAction(async () => {
    id = (await courses.createCourse(parsed.data)).id;
  });
  if (!result.ok) return result;
  redirect(`/studio/courses/${id}/infos`);
}

export async function updateCourseInfoAction(courseId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = courseInfoSchema.safeParse(
    formValues(formData, ["title", "subtitle", "categoryId", "level", "description", "objectives", "prerequisites"]),
  );
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  return runAction(async () => {
    await courses.updateCourseInfo(parseId(courseId), parsed.data);
    refresh();
    return { ok: true, message: "Informations enregistrées." };
  });
}

export async function updateCoursePricingAction(courseId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = coursePricingSchema.safeParse(formValues(formData, ["free", "price", "compareAtPrice"]));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  return runAction(async () => {
    await courses.updateCoursePricing(parseId(courseId), parsed.data);
    refresh();
    return { ok: true, message: "Prix enregistré." };
  });
}

const CHECK_LABELS: Record<string, string> = {
  title: "titre",
  description: "description",
  cover: "image de couverture",
  category: "catégorie",
  section: "au moins une section",
  lessons: "au moins 3 leçons publiables",
};

export async function publishCourseAction(courseId: string): Promise<ActionState> {
  await requireOwner();
  try {
    await courses.publishCourse(parseId(courseId));
  } catch (error) {
    if (error instanceof DomainError && error.code === "COURSE_NOT_PUBLISHABLE") {
      const missing = (error.details?.missing as string[] | undefined) ?? [];
      return { ok: false, message: `Publication impossible. Il manque : ${missing.map((k) => CHECK_LABELS[k] ?? k).join(", ")}.` };
    }
    return runAction(() => Promise.reject(error));
  }
  refresh();
  return { ok: true, message: "Cours publié." };
}

export async function archiveCourseAction(courseId: string): Promise<ActionState> {
  await requireOwner();
  return runAction(async () => {
    await courses.archiveCourse(parseId(courseId));
    refresh();
    return { ok: true, message: "Cours archivé : les inscrits gardent leur accès." };
  });
}

export async function deleteCourseAction(courseId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  if (formData.get("confirm") !== "on") return { ok: false, message: "Cochez la case pour confirmer la suppression." };
  const result = await runAction(() => courses.deleteCourse(parseId(courseId)));
  if (!result.ok) return result;
  redirect("/studio/courses");
}

// --- Sections ---------------------------------------------------------------

export async function addSectionAction(courseId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = sectionTitleSchema.safeParse(formData.get("title"));
  if (!parsed.success) return { ok: false, fieldErrors: { title: parsed.error.issues[0].message } };
  return runAction(async () => {
    await courses.addSection(parseId(courseId), parsed.data);
    refresh();
  });
}

export async function renameSectionAction(sectionId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = sectionTitleSchema.safeParse(formData.get("title"));
  if (!parsed.success) return { ok: false, fieldErrors: { title: parsed.error.issues[0].message } };
  return runAction(async () => {
    await courses.renameSection(parseId(sectionId), parsed.data);
    refresh();
  });
}

export async function deleteSectionAction(sectionId: string): Promise<ActionState> {
  await requireOwner();
  return runAction(async () => {
    await courses.deleteSection(parseId(sectionId));
    refresh();
  });
}

export async function moveSectionAction(sectionId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const dir = direction.safeParse(formData.get("direction"));
  if (!dir.success) return { ok: false, message: "Direction invalide." };
  return runAction(async () => {
    await courses.moveSection(parseId(sectionId), dir.data);
    refresh();
  });
}

// --- Leçons -----------------------------------------------------------------

export async function addLessonAction(sectionId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const title = lessonTitleSchema.safeParse(formData.get("title"));
  const type = lessonTypeSchema.safeParse(formData.get("type"));
  if (!title.success) return { ok: false, fieldErrors: { title: title.error.issues[0].message } };
  if (!type.success) return { ok: false, message: type.error.issues[0].message };
  return runAction(async () => {
    await courses.addLesson(parseId(sectionId), { title: title.data, type: type.data });
    refresh();
  });
}

export async function renameLessonAction(lessonId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = lessonTitleSchema.safeParse(formData.get("title"));
  if (!parsed.success) return { ok: false, fieldErrors: { title: parsed.error.issues[0].message } };
  return runAction(async () => {
    await courses.renameLesson(parseId(lessonId), parsed.data);
    refresh();
  });
}

export async function deleteLessonAction(lessonId: string): Promise<ActionState> {
  await requireOwner();
  return runAction(async () => {
    await courses.deleteLesson(parseId(lessonId));
    refresh();
  });
}

export async function moveLessonAction(lessonId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const dir = direction.safeParse(formData.get("direction"));
  if (!dir.success) return { ok: false, message: "Direction invalide." };
  return runAction(async () => {
    await courses.moveLesson(parseId(lessonId), dir.data);
    refresh();
  });
}

export async function toggleFreePreviewAction(lessonId: string): Promise<ActionState> {
  await requireOwner();
  return runAction(async () => {
    await courses.toggleFreePreview(parseId(lessonId));
    refresh();
  });
}

// --- Catégories ---------------------------------------------------------------

export async function createCategoryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = categorySchema.safeParse(formValues(formData, ["name", "icon", "parentId"]));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  return runAction(async () => {
    await createCategory(parsed.data);
    refresh();
    return { ok: true, message: "Catégorie créée." };
  });
}

export async function updateCategoryAction(categoryId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = categorySchema.omit({ parentId: true }).safeParse(formValues(formData, ["name", "icon"]));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  return runAction(async () => {
    await updateCategory(parseId(categoryId), parsed.data);
    refresh();
    return { ok: true, message: "Catégorie enregistrée." };
  });
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionState> {
  await requireOwner();
  return runAction(async () => {
    await deleteCategory(parseId(categoryId));
    refresh();
  });
}
