import { expect, test } from "@playwright/test";

import { loginAsOwner } from "./owner";

// Chaque test du studio commence connecté en tant que formateur.
test.beforeEach(async ({ page }) => {
  await loginAsOwner(page);
});

/*
 * Parcours du formateur (phase 1) : catégorie → cours → informations → programme → prix → publication refusée (RG-10)
 * → suppression d'un brouillon (RG-14), puis vérification que le brouillon n'apparaît jamais au catalogue public.
 */

test("le formateur crée et structure un cours enregistré en base", async ({ page }) => {
  // Catégorie (F-95)
  await page.goto("/studio/categories");
  await expect(page.getByRole("heading", { name: "Catégories", level: 1 })).toBeVisible();
  const newCategory = page.getByRole("complementary", { name: "Nouvelle catégorie" });
  await newCategory.getByLabel("Nom").fill("Développement web");
  await newCategory.getByRole("button", { name: "Créer la catégorie" }).click();
  await expect(page.getByText("Catégorie créée.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "1 catégorie" })).toBeVisible();

  // Création du cours (F-20, RG-16)
  await page.goto("/studio/courses/new");
  await page.getByLabel("Titre du cours").fill("JavaScript moderne : de zéro à l'autonomie");
  await page.getByLabel("Catégorie").selectOption({ label: "Développement web" });
  await page.getByRole("button", { name: "Créer le cours" }).click();
  await expect(page).toHaveURL(/\/studio\/courses\/[0-9a-f-]+\/infos$/);
  await expect(page.getByText("/courses/javascript-moderne-de-zero-a-l-autonomie")).toBeVisible();

  // Validation côté serveur : titre trop court refusé, saisie conservée
  await page.getByLabel("Titre", { exact: true }).fill("JS");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Le titre doit faire au moins 3 caractères.")).toBeVisible();
  await expect(page.getByLabel("Titre", { exact: true })).toHaveValue("JS");

  // Informations
  await page.getByLabel("Titre", { exact: true }).fill("JavaScript moderne : de zéro à l'autonomie");
  await page.getByLabel("Sous-titre").fill("Variables, fonctions, DOM et projets concrets.");
  await page.getByLabel("Description").fill("Apprenez à écrire du JavaScript moderne.\n\nÀ partir de projets concrets.");
  await page.getByLabel("Ce que l'apprenant va apprendre").fill("Écrire du JavaScript lisible\nManipuler le DOM");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Informations enregistrées.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Sous-titre")).toHaveValue("Variables, fonctions, DOM et projets concrets.");

  // Programme (F-21) : sections, leçons, réordonnancement, aperçu gratuit
  await page.getByRole("link", { name: "Programme" }).click();
  await page.getByLabel("Nouvelle section").fill("Prise en main");
  await page.getByRole("button", { name: "Ajouter une section" }).click();
  const section = page.getByRole("region", { name: "Prise en main" });
  await expect(section).toBeVisible();
  for (const [title, type] of [
    ["Bienvenue dans le cours", "Vidéo"],
    ["Variables et types", "Texte"],
  ] as const) {
    await section.getByLabel("Nouvelle leçon").fill(title);
    await section.getByRole("button", { name: type, exact: true }).click();
    await expect(section.getByText(title, { exact: true })).toBeVisible();
  }
  await section.getByRole("button", { name: "Monter « Variables et types »" }).click();
  await expect(section.getByRole("listitem").first()).toContainText("Variables et types");
  await section.getByRole("button", { name: "Mettre « Bienvenue dans le cours » en aperçu gratuit" }).click();
  await expect(section.getByText("Aperçu gratuit")).toBeVisible();

  // RG-10 : checklist et publication refusée avec les éléments manquants
  const checklist = page.getByRole("complementary", { name: "Prêt à publier ?" });
  await expect(checklist).toContainText("Au moins 3 leçons publiables (0 sur 3)");
  await page.getByRole("link", { name: "Publication" }).click();
  await page.getByRole("button", { name: "Publier maintenant" }).click();
  await expect(page.getByText("Publication impossible. Il manque : image de couverture, au moins 3 leçons publiables.")).toBeVisible();

  // Prix
  await page.getByRole("link", { name: "Prix" }).click();
  await page.getByLabel("Prix (GNF)").fill("250 000");
  await page.getByRole("button", { name: "Enregistrer le prix" }).click();
  await expect(page.getByText("Décochez « Cours gratuit » pour fixer un prix.")).toBeVisible();
  await page.getByLabel("Cours gratuit (inscription en un clic)").uncheck();
  await page.getByLabel("Prix barré (optionnel)").fill("200 000");
  await page.getByRole("button", { name: "Enregistrer le prix" }).click();
  await expect(page.getByText("Le prix barré doit être supérieur au prix.")).toBeVisible();
  await page.getByLabel("Prix barré (optionnel)").fill("350 000");
  await page.getByRole("button", { name: "Enregistrer le prix" }).click();
  await expect(page.getByText("Prix enregistré.")).toBeVisible();

  // Le brouillon n'est jamais visible côté public
  await page.goto("/courses");
  await expect(page.getByText("Aucun cours publié pour l'instant")).toBeVisible();
  await page.goto("/courses/javascript-moderne-de-zero-a-l-autonomie");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();

  // Liste du studio puis suppression du brouillon (RG-14 : jamais publié → supprimable)
  await page.goto("/studio/courses?status=DRAFT");
  await expect(page.getByRole("link", { name: "Brouillons · 1" })).toBeVisible();
  await page.getByRole("link", { name: /Modifier/ }).click();
  await page.getByRole("link", { name: "Publication" }).click();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByText("Cochez la case pour confirmer la suppression.")).toBeVisible();
  await page.getByLabel(/Je confirme vouloir supprimer/).check();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL(/\/studio\/courses$/);
  await expect(page.getByText("Aucun cours pour l'instant")).toBeVisible();
});

test("une catégorie utilisée ne peut pas être supprimée", async ({ page }) => {
  await page.goto("/studio/courses/new");
  await page.getByLabel("Titre du cours").fill("Bases de données SQL");
  await page.getByLabel("Catégorie").selectOption({ label: "Développement web" });
  await page.getByRole("button", { name: "Créer le cours" }).click();
  await expect(page).toHaveURL(/\/infos$/);

  await page.goto("/studio/categories");
  await page.getByRole("button", { name: "Supprimer « Développement web »" }).click();
  await expect(page.getByText(/Cette catégorie contient des cours/)).toBeVisible();
});

test("le studio est utilisable au clavier à 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/studio");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const nav = page.getByRole("navigation", { name: "Navigation du studio" });
  await expect(nav).toBeVisible();
  await expect(page.getByRole("button", { name: "Fermer le menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
