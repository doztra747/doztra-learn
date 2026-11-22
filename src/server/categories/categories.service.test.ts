import { createCategory, deleteCategory, listCategories, updateCategory } from "@/server/categories/categories.service";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import { makeCourse, resetDatabase } from "../../../tests/factories";

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

async function expectDomainError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(DomainError);
  await promise.catch((e: DomainError) => expect(e.code).toBe(code));
}

describe("F-95 : catégories", () => {
  it("crée des catégories avec slug unique et les liste parent puis enfants", async () => {
    const web = await createCategory({ name: "Développement web", icon: "fa-solid fa-code" });
    await createCategory({ name: "Data", icon: "fa-solid fa-database" });
    await createCategory({ name: "Front-end", icon: "fa-solid fa-code", parentId: web.id });
    await createCategory({ name: "Développement  web", icon: "fa-solid fa-code" });
    const rows = await listCategories();
    expect(rows.map((r) => [r.name, r.parentName])).toEqual([
      ["Développement web", null],
      ["Front-end", "Développement web"],
      ["Data", null],
      ["Développement  web", null],
    ]);
    expect(rows.map((r) => r.slug)).toContain("developpement-web-2");
  });

  it("F-95 : refuse un troisième niveau", async () => {
    const root = await createCategory({ name: "Racine", icon: "fa-solid fa-code" });
    const child = await createCategory({ name: "Enfant", icon: "fa-solid fa-code", parentId: root.id });
    await expectDomainError(createCategory({ name: "Petit-enfant", icon: "fa-solid fa-code", parentId: child.id }), "CATEGORY_TOO_DEEP");
  });

  it("renomme une catégorie", async () => {
    const c = await createCategory({ name: "Ancien", icon: "fa-solid fa-code" });
    await updateCategory(c.id, { name: "Nouveau", icon: "fa-solid fa-server" });
    expect((await listCategories())[0]).toMatchObject({ name: "Nouveau", icon: "fa-solid fa-server" });
  });

  it("refuse de supprimer une catégorie utilisée ou parente, supprime sinon", async () => {
    const used = await createCategory({ name: "Utilisée", icon: "fa-solid fa-code" });
    await makeCourse({ categoryId: used.id });
    await expectDomainError(deleteCategory(used.id), "CATEGORY_IN_USE");

    const parent = await createCategory({ name: "Parente", icon: "fa-solid fa-code" });
    await createCategory({ name: "Fille", icon: "fa-solid fa-code", parentId: parent.id });
    await expectDomainError(deleteCategory(parent.id), "CATEGORY_HAS_CHILDREN");

    const free = await createCategory({ name: "Libre", icon: "fa-solid fa-code" });
    await deleteCategory(free.id);
    expect((await listCategories()).map((c) => c.name)).not.toContain("Libre");
  });
});
