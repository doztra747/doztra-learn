import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import {
  addLesson,
  addSection,
  archiveCourse,
  createCourse,
  deleteCourse,
  deleteLesson,
  getCourseForEditor,
  getPublishChecklist,
  moveLesson,
  moveSection,
  publishCourse,
  toggleFreePreview,
  updateCourseInfo,
  updateCoursePricing,
} from "@/server/courses/courses.service";
import { coursePricingSchema } from "@/shared/courses";
import { makeCategory, makeCourse, makeOwner, resetDatabase } from "../../../tests/factories";

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

/** Attend une DomainError portant ce code. */
async function expectDomainError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(DomainError);
  await promise.catch((e: DomainError) => expect(e.code).toBe(code));
}

const info = (title: string, extra: Partial<Parameters<typeof updateCourseInfo>[1]> = {}) => ({
  title,
  level: "BEGINNER" as const,
  objectives: [],
  prerequisites: [],
  ...extra,
});

describe("RG-16 : slug unique", () => {
  it("RG-16 : génère le slug sans accents à partir du titre", async () => {
    const course = await createCourse({ title: "JavaScript moderne : de zéro à l'autonomie", level: "BEGINNER" });
    expect(course.slug).toBe("javascript-moderne-de-zero-a-l-autonomie");
  });

  it("RG-16 : ajoute -2 puis -3 en cas de doublon", async () => {
    const a = await createCourse({ title: "SQL en pratique", level: "BEGINNER" });
    const b = await createCourse({ title: "SQL en pratique", level: "BEGINNER" });
    const c = await createCourse({ title: "SQL  en pratique !", level: "BEGINNER" });
    expect([a.slug, b.slug, c.slug]).toEqual(["sql-en-pratique", "sql-en-pratique-2", "sql-en-pratique-3"]);
  });

  it("RG-16 : deux créations simultanées obtiennent des slugs distincts", async () => {
    const [a, b] = await Promise.all([
      createCourse({ title: "Docker", level: "BEGINNER" }),
      createCourse({ title: "Docker", level: "BEGINNER" }),
    ]);
    expect(new Set([a.slug, b.slug]).size).toBe(2);
  });

  it("RG-16 : le slug suit le titre tant que le cours n'a jamais été publié", async () => {
    const { id } = await createCourse({ title: "Titre provisoire", level: "BEGINNER" });
    await updateCourseInfo(id, info("Python pour la data"));
    expect((await db.course.findUniqueOrThrow({ where: { id } })).slug).toBe("python-pour-la-data");
  });

  it("RG-16 : le slug d'un cours déjà publié ne change plus", async () => {
    const course = await makeCourse({ title: "Ancien titre", status: "ARCHIVED", publishedAt: new Date() });
    await updateCourseInfo(course.id, info("Nouveau titre"));
    expect((await db.course.findUniqueOrThrow({ where: { id: course.id } })).slug).toBe(course.slug);
  });
});

describe("F-20 : informations et prix", () => {
  it("enregistre la description en Tiptap et remplace objectifs et prérequis", async () => {
    const category = await makeCategory();
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    await updateCourseInfo(id, info("Cours", { categoryId: category.id, description: "Premier.\n\nSecond.", objectives: ["A", "B"], prerequisites: ["C"] }));
    await updateCourseInfo(id, info("Cours", { categoryId: category.id, description: "Premier.\n\nSecond.", objectives: ["B"], prerequisites: [] }));
    const course = await getCourseForEditor(id);
    expect(course.description).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Premier." }] },
        { type: "paragraph", content: [{ type: "text", text: "Second." }] },
      ],
    });
    expect(course.objectives.map((o) => [o.kind, o.text])).toEqual([["OBJECTIVE", "B"]]);
  });

  it("refuse une catégorie inexistante", async () => {
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    await expectDomainError(updateCourseInfo(id, info("Cours", { categoryId: "0190f0f0-0000-7000-8000-000000000000" })), "CATEGORY_NOT_FOUND");
  });

  it("enregistre le prix en BigInt et refuse un prix barré inférieur", async () => {
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    await updateCoursePricing(id, { price: 250000, compareAtPrice: 350000 });
    const course = await db.course.findUniqueOrThrow({ where: { id } });
    expect([course.price, course.compareAtPrice]).toEqual([BigInt(250000), BigInt(350000)]);
    await expectDomainError(updateCoursePricing(id, { price: 250000, compareAtPrice: 200000 }), "PRICE_INVALID");
  });

  it("la base refuse un prix négatif même en contournant le service", async () => {
    const course = await makeCourse();
    await expect(db.course.update({ where: { id: course.id }, data: { price: BigInt(-1) } })).rejects.toThrow();
  });
});

describe("RG-10 : conditions de publication", () => {
  it("RG-10 : liste ce qui manque à un cours vide", async () => {
    const { id } = await createCourse({ title: "Cours vide", level: "BEGINNER" });
    const missing = getPublishChecklist(await getCourseForEditor(id)).filter((i) => !i.ok).map((i) => i.key);
    expect(missing).toEqual(["description", "cover", "category", "section", "lessons"]);
  });

  it("RG-10 : refuse la publication et renvoie les éléments manquants", async () => {
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    const error = await publishCourse(id).catch((e: DomainError) => e);
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe("COURSE_NOT_PUBLISHABLE");
    expect((error as DomainError).details?.missing).toContain("cover");
    expect((await db.course.findUniqueOrThrow({ where: { id } })).status).toBe("DRAFT");
  });

  it("RG-10 : publie un cours complet (titre, description, couverture, catégorie, 1 section, 3 leçons publiables)", async () => {
    const owner = await makeOwner();
    const category = await makeCategory();
    const cover = await db.media.create({
      data: { ownerId: owner.id, kind: "IMAGE", storageKey: `img/${Date.now()}/cover`, originalName: "c.webp", mimeType: "image/webp", sizeBytes: BigInt(10), status: "READY" },
    });
    const { id } = await createCourse({ title: "Cours complet", level: "BEGINNER", categoryId: category.id });
    await updateCourseInfo(id, info("Cours complet", { categoryId: category.id, description: "Une description." }));
    await db.course.update({ where: { id }, data: { coverMediaId: cover.id } });
    const section = await addSection(id, "Section 1");
    for (const title of ["A", "B", "C"]) {
      const lesson = await addLesson(section.id, { title, type: "TEXT" });
      // Le contenu des leçons arrive en phase 4 : on simule ici une leçon prête.
      await db.lesson.update({ where: { id: lesson.id }, data: { isPublished: true } });
    }
    await publishCourse(id);
    const course = await db.course.findUniqueOrThrow({ where: { id } });
    expect(course.status).toBe("PUBLISHED");
    expect(course.publishedAt).not.toBeNull();
  });

  it("RG-10 : deux leçons publiables ne suffisent pas", async () => {
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    const section = await addSection(id, "S");
    for (const title of ["A", "B"]) {
      const lesson = await addLesson(section.id, { title, type: "TEXT" });
      await db.lesson.update({ where: { id: lesson.id }, data: { isPublished: true } });
    }
    await addLesson(section.id, { title: "Vidéo sans fichier", type: "VIDEO" });
    const lessons = getPublishChecklist(await getCourseForEditor(id)).find((i) => i.key === "lessons");
    expect(lessons).toMatchObject({ ok: false, detail: "2 sur 3" });
  });
});

describe("Transitions d'état et RG-14", () => {
  it("archive un cours publié, refuse d'archiver un brouillon", async () => {
    const published = await makeCourse({ status: "PUBLISHED" });
    await archiveCourse(published.id);
    expect((await db.course.findUniqueOrThrow({ where: { id: published.id } })).status).toBe("ARCHIVED");
    const draft = await makeCourse();
    await expectDomainError(archiveCourse(draft.id), "INVALID_TRANSITION");
  });

  it("RG-14 : supprime un brouillon jamais publié", async () => {
    const draft = await makeCourse();
    await deleteCourse(draft.id);
    expect(await db.course.findUnique({ where: { id: draft.id } })).toBeNull();
  });

  it("RG-14 : refuse de supprimer un cours déjà publié (archivage seulement)", async () => {
    const archived = await makeCourse({ status: "ARCHIVED", publishedAt: new Date() });
    await expectDomainError(deleteCourse(archived.id), "COURSE_HAS_ENROLLMENTS");
    expect(await db.course.findUnique({ where: { id: archived.id } })).not.toBeNull();
  });
});

describe("F-21 : sections et leçons", () => {
  it("ajoute à la fin et réordonne les sections", async () => {
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    const a = await addSection(id, "A");
    const b = await addSection(id, "B");
    await moveSection(b.id, "up");
    expect((await getCourseForEditor(id)).sections.map((s) => [s.title, s.position])).toEqual([["B", 1], ["A", 2]]);
    await moveSection(b.id, "up"); // déjà en tête : sans effet
    expect((await getCourseForEditor(id)).sections.map((s) => s.id)).toEqual([b.id, a.id]);
  });

  it("réordonne et supprime des leçons en gardant des positions 1..n", async () => {
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    const section = await addSection(id, "S");
    const l1 = await addLesson(section.id, { title: "1", type: "TEXT" });
    await addLesson(section.id, { title: "2", type: "VIDEO" });
    const l3 = await addLesson(section.id, { title: "3", type: "QUIZ" });
    await moveLesson(l3.id, "up");
    await deleteLesson(l1.id);
    const lessons = (await getCourseForEditor(id)).sections[0].lessons;
    expect(lessons.map((l) => [l.title, l.position])).toEqual([["3", 1], ["2", 2]]);
  });

  it("F-14 : bascule l'aperçu gratuit", async () => {
    const { id } = await createCourse({ title: "Cours", level: "BEGINNER" });
    const section = await addSection(id, "S");
    const lesson = await addLesson(section.id, { title: "1", type: "TEXT" });
    await toggleFreePreview(lesson.id);
    expect((await db.lesson.findUniqueOrThrow({ where: { id: lesson.id } })).isFreePreview).toBe(true);
  });

  it("refuse de modifier le programme d'un cours publié", async () => {
    const course = await makeCourse({ status: "PUBLISHED" });
    await expectDomainError(addSection(course.id, "Nouvelle"), "COURSE_LOCKED");
  });
});

describe("RG-05 : un seul OWNER (contrainte en base)", () => {
  it("RG-05 : la base refuse un second OWNER", async () => {
    const a = await makeOwner();
    const b = await makeOwner();
    await db.userRole.create({ data: { userId: a.id, role: "OWNER" } });
    await expect(db.userRole.create({ data: { userId: b.id, role: "OWNER" } })).rejects.toThrow();
  });
});

describe("Saisie du prix (schéma partagé)", () => {
  it("accepte « 250 000 » et le convertit en entier", () => {
    expect(coursePricingSchema.parse({ price: "250 000", compareAtPrice: "" })).toEqual({ price: 250000, compareAtPrice: undefined });
  });

  it("refuse un prix saisi avec « Cours gratuit » coché", () => {
    const result = coursePricingSchema.safeParse({ free: "on", price: "250000" });
    expect(result.success).toBe(false);
  });

  it("refuse les décimales et le texte", () => {
    expect(coursePricingSchema.safeParse({ price: "12,5" }).success).toBe(false);
    expect(coursePricingSchema.safeParse({ price: "abc" }).success).toBe(false);
  });
});
