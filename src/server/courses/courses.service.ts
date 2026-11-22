import "server-only";

import { type CourseLevel, type CourseStatus, type LessonType, Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { DomainError, isUniqueViolation } from "@/server/errors";
import { slugify, textToTiptap } from "@/shared/courses";

/*
 * Domaine « cours » : création, informations, prix, structure (sections et leçons) et transitions d'état.
 * Règles : RG-10 (publication), RG-14 (suppression), RG-16 (slug). Les transitions passent par publishCourse /
 * archiveCourse / deleteCourse, jamais par un update({ status }) depuis une action.
 */

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Lecture

export async function getCourseOrThrow(id: string) {
  const course = await db.course.findFirst({ where: { id, deletedAt: null } });
  if (!course) throw new DomainError("COURSE_NOT_FOUND", "Cours introuvable.", undefined, 404);
  return course;
}

/** Cours complet pour l'éditeur du studio (programme trié, objectifs, catégorie). */
export async function getCourseForEditor(id: string) {
  const course = await db.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      objectives: { orderBy: [{ kind: "asc" }, { position: "asc" }] },
      sections: {
        where: { deletedAt: null },
        orderBy: { position: "asc" },
        include: { lessons: { where: { deletedAt: null }, orderBy: { position: "asc" } } },
      },
    },
  });
  if (!course) throw new DomainError("COURSE_NOT_FOUND", "Cours introuvable.", undefined, 404);
  return course;
}

export type EditorCourse = Awaited<ReturnType<typeof getCourseForEditor>>;

/** Liste du studio, filtrable par statut, avec les compteurs par statut (onglets). */
export async function listStudioCourses(status?: CourseStatus) {
  const [courses, grouped] = await Promise.all([
    db.course.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        price: true,
        scheduledAt: true,
        updatedAt: true,
        category: { select: { name: true, icon: true } },
        sections: { where: { deletedAt: null }, select: { _count: { select: { lessons: { where: { deletedAt: null } } } } } },
      },
    }),
    db.course.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  const counts: Record<CourseStatus | "ALL", number> = { ALL: 0, DRAFT: 0, SCHEDULED: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    counts.ALL += g._count._all;
  }
  return {
    counts,
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      price: c.price,
      scheduledAt: c.scheduledAt,
      updatedAt: c.updatedAt,
      categoryName: c.category?.name ?? null,
      categoryIcon: c.category?.icon ?? null,
      lessonCount: c.sections.reduce((n, s) => n + s._count.lessons, 0),
    })),
  };
}

/** Indicateurs du tableau de bord disponibles en phase 1 (contenus). */
export async function getContentStats() {
  const [byStatus, sections, lessons, categories] = await Promise.all([
    db.course.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    db.section.count({ where: { deletedAt: null, course: { deletedAt: null } } }),
    db.lesson.count({ where: { deletedAt: null, section: { deletedAt: null, course: { deletedAt: null } } } }),
    db.category.count(),
  ]);
  const count = (s: CourseStatus) => byStatus.find((g) => g.status === s)?._count._all ?? 0;
  return {
    published: count("PUBLISHED"),
    drafts: count("DRAFT"),
    scheduled: count("SCHEDULED"),
    archived: count("ARCHIVED"),
    sections,
    lessons,
    categories,
  };
}

// ---------------------------------------------------------------------------
// RG-16 : slug unique, suffixe -2, -3… ; figé dès la première publication.

async function uniqueCourseSlug(tx: Tx, title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  const taken = await tx.course.findMany({
    where: { slug: { startsWith: base }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true },
  });
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) if (!set.has(`${base}-${i}`)) return `${base}-${i}`;
}

/** Réessaie quand deux écritures simultanées obtiennent le même slug (contrainte unique en base). */
async function withSlugRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= 4) throw error;
    }
  }
}

async function assertCategoryExists(tx: Tx, categoryId?: string) {
  if (!categoryId) return;
  const exists = await tx.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!exists) throw new DomainError("CATEGORY_NOT_FOUND", "La catégorie choisie n'existe plus.", undefined, 404);
}

// ---------------------------------------------------------------------------
// Création et modification (F-20)

export async function createCourse(input: { title: string; categoryId?: string; level: CourseLevel }) {
  return withSlugRetry(() =>
    db.$transaction(async (tx) => {
      await assertCategoryExists(tx, input.categoryId);
      return tx.course.create({
        data: {
          title: input.title,
          slug: await uniqueCourseSlug(tx, input.title),
          level: input.level,
          categoryId: input.categoryId ?? null,
        },
        select: { id: true, slug: true },
      });
    }),
  );
}

export async function updateCourseInfo(
  id: string,
  input: {
    title: string;
    subtitle?: string;
    categoryId?: string;
    level: CourseLevel;
    description?: string;
    objectives: string[];
    prerequisites: string[];
  },
) {
  await withSlugRetry(() =>
    db.$transaction(async (tx) => {
      const course = await tx.course.findFirst({ where: { id, deletedAt: null }, select: { title: true, publishedAt: true } });
      if (!course) throw new DomainError("COURSE_NOT_FOUND", "Cours introuvable.", undefined, 404);
      await assertCategoryExists(tx, input.categoryId);

      // RG-16 : tant que le cours n'a jamais été publié, le slug suit le titre.
      const slug = !course.publishedAt && course.title !== input.title ? await uniqueCourseSlug(tx, input.title, id) : undefined;

      await tx.course.update({
        where: { id },
        data: {
          title: input.title,
          subtitle: input.subtitle ?? null,
          categoryId: input.categoryId ?? null,
          level: input.level,
          description: input.description ? textToTiptap(input.description) : Prisma.DbNull,
          ...(slug ? { slug } : {}),
        },
      });
      await tx.courseObjective.deleteMany({ where: { courseId: id } });
      const objectives = [
        ...input.objectives.map((text, i) => ({ courseId: id, kind: "OBJECTIVE" as const, text, position: i + 1 })),
        ...input.prerequisites.map((text, i) => ({ courseId: id, kind: "PREREQUISITE" as const, text, position: i + 1 })),
      ];
      if (objectives.length) await tx.courseObjective.createMany({ data: objectives });
    }),
  );
}

export async function updateCoursePricing(id: string, input: { price: number; compareAtPrice?: number }) {
  await getCourseOrThrow(id);
  if (input.compareAtPrice !== undefined && input.compareAtPrice <= input.price) {
    throw new DomainError("PRICE_INVALID", "Le prix barré doit être supérieur au prix.");
  }
  await db.course.update({
    where: { id },
    data: { price: BigInt(input.price), compareAtPrice: input.compareAtPrice === undefined ? null : BigInt(input.compareAtPrice) },
  });
}

// ---------------------------------------------------------------------------
// RG-10 : conditions de publication

export type ReadinessItem = { key: string; label: string; ok: boolean; detail?: string };

/**
 * Une leçon est publiable quand son contenu est prêt (RG-10, RG-11).
 * Le contenu des leçons (texte, vidéo, PDF, quiz) arrive avec les phases 4 à 6 : d'ici là, aucune leçon n'a de contenu.
 */
export function lessonReadiness(lesson: { type: LessonType; isPublished: boolean }): { ok: boolean; reason?: string } {
  if (lesson.isPublished) return { ok: true };
  return { ok: false, reason: lesson.type === "VIDEO" ? "Vidéo à importer" : "Contenu à ajouter" };
}

export function getPublishChecklist(course: {
  title: string;
  description: unknown;
  coverMediaId: string | null;
  categoryId: string | null;
  sections: { lessons: { type: LessonType; isPublished: boolean }[] }[];
}): ReadinessItem[] {
  const publishable = course.sections.flatMap((s) => s.lessons).filter((l) => lessonReadiness(l).ok).length;
  const hasDescription =
    !!course.description &&
    typeof course.description === "object" &&
    "content" in course.description &&
    Array.isArray(course.description.content) &&
    course.description.content.length > 0;
  return [
    { key: "title", label: "Titre", ok: course.title.trim().length >= 3 },
    { key: "description", label: "Description", ok: hasDescription },
    { key: "cover", label: "Image de couverture", ok: !!course.coverMediaId },
    { key: "category", label: "Catégorie", ok: !!course.categoryId },
    { key: "section", label: "Au moins 1 section", ok: course.sections.length >= 1 },
    { key: "lessons", label: "Au moins 3 leçons publiables", ok: publishable >= 3, detail: `${publishable} sur 3` },
  ];
}

// ---------------------------------------------------------------------------
// Transitions d'état (machine : DRAFT → PUBLISHED, PUBLISHED → ARCHIVED, ARCHIVED → PUBLISHED)

export async function publishCourse(id: string) {
  const course = await getCourseForEditor(id);
  if (course.status !== "DRAFT" && course.status !== "ARCHIVED") {
    throw new DomainError("INVALID_TRANSITION", "Ce cours est déjà publié ou programmé.");
  }
  const missing = getPublishChecklist(course).filter((item) => !item.ok);
  if (missing.length) {
    throw new DomainError("COURSE_NOT_PUBLISHABLE", "Ce cours ne remplit pas encore les conditions de publication.", {
      missing: missing.map((m) => m.key),
    });
  }
  await db.course.update({
    where: { id, status: course.status },
    data: { status: "PUBLISHED", publishedAt: course.publishedAt ?? new Date(), scheduledAt: null },
  });
}

export async function archiveCourse(id: string) {
  const course = await getCourseOrThrow(id);
  if (course.status !== "PUBLISHED") {
    throw new DomainError("INVALID_TRANSITION", "Seul un cours publié peut être archivé.");
  }
  await db.course.update({ where: { id, status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
}

/**
 * RG-14 : un cours qui a des inscrits ne peut pas être supprimé. Les inscriptions n'existant que sur des cours publiés,
 * un cours déjà publié une fois est toujours considéré comme pouvant en avoir : il s'archive, il ne se supprime pas.
 */
export async function deleteCourse(id: string) {
  const course = await getCourseOrThrow(id);
  if (course.publishedAt) {
    throw new DomainError("COURSE_HAS_ENROLLMENTS", "Un cours déjà publié ne peut pas être supprimé : archivez-le.");
  }
  await db.course.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Structure : sections et leçons (F-21)

/** La structure d'un cours publié ou programmé ne se modifie pas directement (RG-13 : brouillon à venir). */
function assertStructureEditable(status: CourseStatus) {
  if (status === "PUBLISHED" || status === "SCHEDULED") {
    throw new DomainError("COURSE_LOCKED", "Le programme d'un cours publié ne peut pas être modifié pour l'instant : archivez-le d'abord.");
  }
}

async function getSectionOrThrow(tx: Tx, sectionId: string) {
  const section = await tx.section.findFirst({
    where: { id: sectionId, deletedAt: null, course: { deletedAt: null } },
    select: { id: true, courseId: true, course: { select: { status: true } } },
  });
  if (!section) throw new DomainError("SECTION_NOT_FOUND", "Section introuvable.", undefined, 404);
  assertStructureEditable(section.course.status);
  return section;
}

async function getLessonOrThrow(tx: Tx, lessonId: string) {
  const lesson = await tx.lesson.findFirst({
    where: { id: lessonId, deletedAt: null, section: { deletedAt: null, course: { deletedAt: null } } },
    select: { id: true, sectionId: true, isFreePreview: true, section: { select: { courseId: true, course: { select: { status: true } } } } },
  });
  if (!lesson) throw new DomainError("LESSON_NOT_FOUND", "Leçon introuvable.", undefined, 404);
  assertStructureEditable(lesson.section.course.status);
  return lesson;
}

/** Réécrit les positions 1..n dans l'ordre donné (pas de positions flottantes). */
async function rewritePositions(tx: Tx, model: "section" | "lesson", orderedIds: string[]) {
  for (const [i, id] of orderedIds.entries()) {
    if (model === "section") await tx.section.update({ where: { id }, data: { position: i + 1 } });
    else await tx.lesson.update({ where: { id }, data: { position: i + 1 } });
  }
}

function moved(ids: string[], id: string, direction: "up" | "down"): string[] | null {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export async function addSection(courseId: string, title: string) {
  return db.$transaction(async (tx) => {
    const course = await tx.course.findFirst({ where: { id: courseId, deletedAt: null }, select: { status: true } });
    if (!course) throw new DomainError("COURSE_NOT_FOUND", "Cours introuvable.", undefined, 404);
    assertStructureEditable(course.status);
    const last = await tx.section.aggregate({ where: { courseId, deletedAt: null }, _max: { position: true } });
    return tx.section.create({ data: { courseId, title, position: (last._max.position ?? 0) + 1 }, select: { id: true } });
  });
}

export async function renameSection(sectionId: string, title: string) {
  await db.$transaction(async (tx) => {
    await getSectionOrThrow(tx, sectionId);
    await tx.section.update({ where: { id: sectionId }, data: { title } });
  });
}

export async function deleteSection(sectionId: string) {
  await db.$transaction(async (tx) => {
    const section = await getSectionOrThrow(tx, sectionId);
    await tx.section.delete({ where: { id: sectionId } });
    const rest = await tx.section.findMany({ where: { courseId: section.courseId, deletedAt: null }, orderBy: { position: "asc" }, select: { id: true } });
    await rewritePositions(tx, "section", rest.map((s) => s.id));
  });
}

export async function moveSection(sectionId: string, direction: "up" | "down") {
  await db.$transaction(async (tx) => {
    const section = await getSectionOrThrow(tx, sectionId);
    const siblings = await tx.section.findMany({ where: { courseId: section.courseId, deletedAt: null }, orderBy: { position: "asc" }, select: { id: true } });
    const order = moved(siblings.map((s) => s.id), sectionId, direction);
    if (order) await rewritePositions(tx, "section", order);
  });
}

export async function addLesson(sectionId: string, input: { title: string; type: LessonType }) {
  return db.$transaction(async (tx) => {
    await getSectionOrThrow(tx, sectionId);
    const last = await tx.lesson.aggregate({ where: { sectionId, deletedAt: null }, _max: { position: true } });
    return tx.lesson.create({
      data: { sectionId, title: input.title, type: input.type, position: (last._max.position ?? 0) + 1 },
      select: { id: true },
    });
  });
}

export async function renameLesson(lessonId: string, title: string) {
  await db.$transaction(async (tx) => {
    await getLessonOrThrow(tx, lessonId);
    await tx.lesson.update({ where: { id: lessonId }, data: { title } });
  });
}

export async function deleteLesson(lessonId: string) {
  await db.$transaction(async (tx) => {
    const lesson = await getLessonOrThrow(tx, lessonId);
    await tx.lesson.delete({ where: { id: lessonId } });
    const rest = await tx.lesson.findMany({ where: { sectionId: lesson.sectionId, deletedAt: null }, orderBy: { position: "asc" }, select: { id: true } });
    await rewritePositions(tx, "lesson", rest.map((l) => l.id));
  });
}

export async function moveLesson(lessonId: string, direction: "up" | "down") {
  await db.$transaction(async (tx) => {
    const lesson = await getLessonOrThrow(tx, lessonId);
    const siblings = await tx.lesson.findMany({ where: { sectionId: lesson.sectionId, deletedAt: null }, orderBy: { position: "asc" }, select: { id: true } });
    const order = moved(siblings.map((l) => l.id), lessonId, direction);
    if (order) await rewritePositions(tx, "lesson", order);
  });
}

/** F-14 : aperçu gratuit d'une leçon (accessible sans inscription). */
export async function toggleFreePreview(lessonId: string) {
  await db.$transaction(async (tx) => {
    const lesson = await getLessonOrThrow(tx, lessonId);
    await tx.lesson.update({ where: { id: lessonId }, data: { isFreePreview: !lesson.isFreePreview } });
  });
}
