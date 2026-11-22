import { expect, type Page } from "@playwright/test";

/** Compte formateur de la base de test (créé par global-setup ; jamais utilisé hors des tests). */
export const OWNER = { email: "formateur@exemple.test", password: "motdepasse-e2e-1" };

export async function loginAsOwner(page: Page, next = "/studio") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Adresse e-mail").fill(OWNER.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(OWNER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/?]/g, "\$&")}$`));
}
