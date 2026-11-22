import "server-only";

import { type CourseLevel, Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { type CategoryIcon, CATEGORY_ICONS, LEVEL_LABELS, tiptapToText } from "@/shared/courses";

/*
 * Catalogue public (F-10 à F-13) : uniquement les cours PUBLISHED et non supprimés.
 * Les objets renvoyés sont construits pour l'affichage (jamais de modèle Prisma brut).
 */

export type CourseSummary = {
  slug: string;
  title: string;
  subtitle: string | null;
  categoryName: string | null;
  icon: CategoryIcon;
  levelLabel: string;
  /** GNF ; ≤ 1 milliard (limite de saisie), donc représentable sans perte en number. */
  price: number;
  compareAtPrice: number | null;
  lessonCount: number;
  durationSeconds: number;
};

export type CatalogFilters = { q?: string; category?: string; level?: CourseLevel; price?: "free" | "paid"; sort?: "new" | "price" };

const PUBLISHED = { status: "PUBLISHED" as const, deletedAt: null };

const summarySelect = {
  slug: true,
  title: true,
  subtitle: true,
  level: true,
  price: true,
  compareAtPrice: true,
  durationSeconds: true,
  category: { select: { name: true, icon: true } },
  sections: { where: { deletedAt: null }, select: { _count: { select: { lessons: { where: { deletedAt: null } } } } } },
} satisfies Prisma.CourseSelect;

type SummaryRow = Prisma.CourseGetPayload<{ select: typeof summarySelect }>;

const asIcon = (icon?: string | null): CategoryIcon =>
  icon && (CATEGORY_ICONS as readonly string[]).includes(icon) ? (icon as CategoryIcon) : "fa-solid fa-book-open";

function toSummary(c: SummaryRow): CourseSummary {
  return {
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    categoryName: c.category?.name ?? null,
    icon: asIcon(c.category?.icon),
    levelLabel: LEVEL_LABELS[c.level],
    price: Number(c.price),
    compareAtPrice: c.compareAtPrice === null ? null : Number(c.compareAtPrice),
    lessonCount: c.sections.reduce((n, s) => n + s._count.lessons, 0),
    durationSeconds: c.durationSeconds,
  };
}

/** Échappe %, _ et \ pour un motif ILIKE. */
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

/** F-11, F-12 : catalogue filtré ; recherche insensible à la casse et aux accents (titre et sous-titre). */
export async function searchPublishedCourses(filters: CatalogFilters): Promise<CourseSummary[]> {
  let ids: string[] | undefined;
  const q = filters.q?.trim();
  if (q) {
    const pattern = likePattern(q);
    const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM courses
      WHERE status = 'PUBLISHED' AND deleted_at IS NULL
        AND (unaccent(title) ILIKE unaccent(${pattern}) OR unaccent(coalesce(subtitle, '')) ILIKE unaccent(${pattern}))
      LIMIT 200`);
    ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];
  }

  const courses = await db.course.findMany({
    where: {
      ...PUBLISHED,
      ...(ids ? { id: { in: ids } } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.level ? { level: filters.level } : {}),
      ...(filters.price === "free" ? { price: BigInt(0) } : filters.price === "paid" ? { price: { gt: BigInt(0) } } : {}),
    },
    orderBy: filters.sort === "price" ? [{ price: "asc" }, { title: "asc" }] : [{ publishedAt: "desc" }],
    take: 60,
    select: summarySelect,
  });
  return courses.map(toSummary);
}

/** F-10 : derniers cours publiés pour l'accueil. */
export async function getFeaturedCourses(limit = 4): Promise<CourseSummary[]> {
  const courses = await db.course.findMany({ where: PUBLISHED, orderBy: { publishedAt: "desc" }, take: limit, select: summarySelect });
  return courses.map(toSummary);
}

/** Catégories avec le nombre de cours publiés (accueil, filtres du catalogue). */
export async function getPublicCategories() {
  const categories = await db.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { name: true, slug: true, icon: true, parentId: true, _count: { select: { courses: { where: PUBLISHED } } } },
  });
  return categories.map((c) => ({ name: c.name, slug: c.slug, icon: asIcon(c.icon), isChild: !!c.parentId, courseCount: c._count.courses }));
}

/** F-13 : fiche d'un cours publié (null sinon : la page répond 404 sans révéler l'existence d'un brouillon). */
export async function getPublishedCourse(slug: string) {
  const course = await db.course.findFirst({
    where: { slug, ...PUBLISHED },
    select: {
      ...summarySelect,
      description: true,
      objectives: { orderBy: { position: "asc" }, select: { kind: true, text: true } },
      sections: {
        where: { deletedAt: null },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          _count: { select: { lessons: { where: { deletedAt: null } } } },
          lessons: {
            where: { deletedAt: null },
            orderBy: { position: "asc" },
            select: { id: true, title: true, type: true, isFreePreview: true, durationSeconds: true },
          },
        },
      },
    },
  });
  if (!course) return null;
  return {
    ...toSummary(course),
    description: tiptapToText(course.description),
    objectives: course.objectives.filter((o) => o.kind === "OBJECTIVE").map((o) => o.text),
    prerequisites: course.objectives.filter((o) => o.kind === "PREREQUISITE").map((o) => o.text),
    sections: course.sections.map((s) => ({ id: s.id, title: s.title, lessons: s.lessons })),
  };
}

export type PublishedCourse = NonNullable<Awaited<ReturnType<typeof getPublishedCourse>>>;
