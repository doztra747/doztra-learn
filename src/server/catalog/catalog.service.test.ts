import { getFeaturedCourses, getPublicCategories, getPublishedCourse, searchPublishedCourses } from "@/server/catalog/catalog.service";
import { db } from "@/server/db";
import { makeCategory, makeCourse, resetDatabase } from "../../../tests/factories";

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

describe("Catalogue public (F-10 à F-13)", () => {
  it("ne montre que les cours publiés", async () => {
    await makeCourse({ title: "Brouillon", status: "DRAFT" });
    await makeCourse({ title: "Archivé", status: "ARCHIVED", publishedAt: new Date() });
    await makeCourse({ title: "Publié", status: "PUBLISHED" });
    expect((await searchPublishedCourses({})).map((c) => c.title)).toEqual(["Publié"]);
    expect((await getFeaturedCourses()).map((c) => c.title)).toEqual(["Publié"]);
  });

  it("F-12 : la recherche ignore la casse et les accents", async () => {
    await makeCourse({ title: "Sécurité des API", status: "PUBLISHED" });
    await makeCourse({ title: "Docker", status: "PUBLISHED" });
    expect((await searchPublishedCourses({ q: "SECURITE" })).map((c) => c.title)).toEqual(["Sécurité des API"]);
  });

  it("F-12 : les caractères spéciaux de ILIKE sont traités comme du texte", async () => {
    await makeCourse({ title: "100 % pratique", status: "PUBLISHED" });
    await makeCourse({ title: "Cours ordinaire", status: "PUBLISHED" });
    expect((await searchPublishedCourses({ q: "%" })).map((c) => c.title)).toEqual(["100 % pratique"]);
  });

  it("F-11 : filtre par catégorie, niveau et prix", async () => {
    const data = await makeCategory({ name: "Data" });
    const paid = await makeCourse({ title: "Payant data", status: "PUBLISHED", categoryId: data.id });
    await db.course.update({ where: { id: paid.id }, data: { price: BigInt(200000), level: "INTERMEDIATE" } });
    await makeCourse({ title: "Gratuit data", status: "PUBLISHED", categoryId: data.id });
    await makeCourse({ title: "Autre", status: "PUBLISHED" });
    expect((await searchPublishedCourses({ category: data.slug, price: "paid" })).map((c) => c.title)).toEqual(["Payant data"]);
    expect((await searchPublishedCourses({ level: "INTERMEDIATE" })).map((c) => c.price)).toEqual([200000]);
    const categories = await getPublicCategories();
    expect(categories.find((c) => c.slug === data.slug)?.courseCount).toBe(2);
  });

  it("F-13 : la fiche d'un brouillon n'est pas accessible", async () => {
    const draft = await makeCourse({ title: "Secret", status: "DRAFT" });
    expect(await getPublishedCourse(draft.slug)).toBeNull();
    const published = await makeCourse({ title: "Public", status: "PUBLISHED" });
    expect(await getPublishedCourse(published.slug)).toMatchObject({ title: "Public", sections: [] });
  });
});
