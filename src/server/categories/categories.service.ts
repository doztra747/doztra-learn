import "server-only";

import { db } from "@/server/db";
import { DomainError, isUniqueViolation } from "@/server/errors";
import { type CategoryIcon, CATEGORY_ICONS, slugify } from "@/shared/courses";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: CategoryIcon;
  parentId: string | null;
  parentName: string | null;
  courseCount: number;
  childCount: number;
};

const asIcon = (icon: string): CategoryIcon =>
  (CATEGORY_ICONS as readonly string[]).includes(icon) ? (icon as CategoryIcon) : "fa-solid fa-book-open";

/** Catégories triées : chaque parent suivi de ses enfants (F-95). */
export async function listCategories(): Promise<CategoryRow[]> {
  const rows = await db.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { parent: { select: { name: true } }, _count: { select: { courses: { where: { deletedAt: null } }, children: true } } },
  });
  const toRow = (c: (typeof rows)[number]): CategoryRow => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: asIcon(c.icon),
    parentId: c.parentId,
    parentName: c.parent?.name ?? null,
    courseCount: c._count.courses,
    childCount: c._count.children,
  });
  const roots = rows.filter((c) => !c.parentId);
  return roots.flatMap((root) => [toRow(root), ...rows.filter((c) => c.parentId === root.id).map(toRow)]);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const taken = await db.category.findMany({
    where: { slug: { startsWith: base }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true },
  });
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) if (!set.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function createCategory(input: { name: string; icon: CategoryIcon; parentId?: string }) {
  if (input.parentId) {
    const parent = await db.category.findUnique({ where: { id: input.parentId }, select: { parentId: true } });
    if (!parent) throw new DomainError("CATEGORY_NOT_FOUND", "La catégorie parente n'existe pas.", undefined, 404);
    // F-95 : deux niveaux maximum.
    if (parent.parentId) throw new DomainError("CATEGORY_TOO_DEEP", "Une sous-catégorie ne peut pas avoir elle-même de sous-catégorie.");
  }
  const last = await db.category.aggregate({ where: { parentId: input.parentId ?? null }, _max: { position: true } });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.category.create({
        data: {
          name: input.name,
          icon: input.icon,
          parentId: input.parentId ?? null,
          slug: await uniqueSlug(slugify(input.name, 90)),
          position: (last._max.position ?? 0) + 1,
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error; // course entre deux créations : on recalcule le slug
    }
  }
  throw new DomainError("CATEGORY_SLUG_CONFLICT", "Impossible de créer la catégorie, réessayez.");
}

export async function updateCategory(id: string, input: { name: string; icon: CategoryIcon }) {
  const existing = await db.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new DomainError("CATEGORY_NOT_FOUND", "Catégorie introuvable.", undefined, 404);
  await db.category.update({ where: { id }, data: { name: input.name, icon: input.icon } });
}

export async function deleteCategory(id: string) {
  const category = await db.category.findUnique({
    where: { id },
    select: { _count: { select: { courses: true, children: true } } },
  });
  if (!category) throw new DomainError("CATEGORY_NOT_FOUND", "Catégorie introuvable.", undefined, 404);
  if (category._count.children > 0) {
    throw new DomainError("CATEGORY_HAS_CHILDREN", "Supprimez ou déplacez d'abord ses sous-catégories.");
  }
  if (category._count.courses > 0) {
    throw new DomainError("CATEGORY_IN_USE", "Cette catégorie contient des cours : changez-leur de catégorie avant de la supprimer.");
  }
  await db.category.delete({ where: { id } });
}
