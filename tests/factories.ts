import { db } from "@/server/db";

/** Vide les tables de la phase 1 entre deux tests (ordre respectant les clés étrangères). */
export async function resetDatabase() {
  await db.$executeRaw`TRUNCATE TABLE "sessions", "login_attempts", "course_tags", "tags", "course_objectives", "lessons", "sections", "courses", "categories", "media", "user_roles", "users" CASCADE`;
}

let counter = 0;
const next = () => ++counter;

export async function makeCategory(overrides: { name?: string; parentId?: string } = {}) {
  const n = next();
  return db.category.create({
    data: { name: overrides.name ?? `Catégorie ${n}`, slug: `categorie-${n}-${Date.now()}`, icon: "fa-solid fa-code", position: n, parentId: overrides.parentId },
  });
}

export async function makeCourse(overrides: { title?: string; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; publishedAt?: Date; categoryId?: string } = {}) {
  const n = next();
  return db.course.create({
    data: {
      title: overrides.title ?? `Cours ${n}`,
      slug: `cours-${n}-${Date.now()}`,
      status: overrides.status ?? "DRAFT",
      publishedAt: overrides.publishedAt ?? (overrides.status === "PUBLISHED" ? new Date() : null),
      categoryId: overrides.categoryId,
    },
  });
}

export async function makeOwner() {
  const n = next();
  return db.user.create({ data: { email: `owner${n}@exemple.test`, firstName: "Test", lastName: "Owner" } });
}
