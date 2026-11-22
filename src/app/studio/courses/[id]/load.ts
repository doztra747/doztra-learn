import "server-only";

import { notFound } from "next/navigation";
import { connection } from "next/server";

import { requireOwner } from "@/server/auth/dal";
import { getCourseForEditor } from "@/server/courses/courses.service";
import { isDomainError } from "@/server/errors";
import { idSchema } from "@/shared/courses";

/** Charge le cours de l'éditeur à chaque requête ; id invalide ou cours absent → 404. */
export async function loadEditorCourse(params: Promise<{ id: string }>) {
  await connection();
  // Défense en profondeur : la page est déjà gardée par <OwnerOnly> (session mémoïsée, pas de requête en plus).
  await requireOwner();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  try {
    return await getCourseForEditor(id.data);
  } catch (error) {
    if (isDomainError(error) && error.code === "COURSE_NOT_FOUND") notFound();
    throw error;
  }
}
