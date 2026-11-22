import { expect, test } from "@playwright/test";

import { OWNER } from "./owner";

test("l'espace formateur exige la connexion", async ({ page }) => {
  // Sans session : redirection vers la connexion, avec retour prévu vers la page demandée.
  await page.goto("/studio/courses");
  await expect(page).toHaveURL(/\/login\?next=%2Fstudio%2Fcourses$/);

  // Mauvais mot de passe : message unique, l'e-mail reste saisi.
  await page.getByLabel("Adresse e-mail").fill(OWNER.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("mauvais-mot-de-passe-1");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue(OWNER.email);

  // Bon mot de passe : retour sur la page demandée.
  await page.getByLabel("Mot de passe", { exact: true }).fill(OWNER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/studio\/courses$/);
  await expect(page.getByRole("heading", { name: "Mes cours", level: 1 })).toBeVisible();

  // Cookie de session : HttpOnly, Secure, SameSite=Lax, préfixe __Host-.
  const cookie = (await page.context().cookies()).find((c) => c.name === "__Host-dzl.sid");
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax", path: "/" });

  // Déconnexion : la session est détruite, le studio redemande la connexion.
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/login\?next=%2Fstudio$/);
});

test("un cookie de session invalide ne donne pas accès au studio", async ({ page }) => {
  // Jeton forgé envoyé directement dans l'en-tête Cookie (simule un attaquant).
  await page.setExtraHTTPHeaders({ cookie: "__Host-dzl.sid=jeton-invente" });
  await page.goto("/studio");
  // Le proxy laisse passer (un cookie existe) mais la DAL refuse : retour à la connexion.
  await expect(page).toHaveURL(/\/login\?next=%2Fstudio$/);
});

test("une action du studio est refusée sans session", async ({ request }) => {
  // Appel direct d'une page du studio sans cookie : jamais de contenu du studio.
  const response = await request.get("/studio/categories", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toContain("/login?next=");
});
