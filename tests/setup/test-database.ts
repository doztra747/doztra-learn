import { existsSync } from "node:fs";

/** URL de la base de test : même serveur que .env, base « <nom>_test ». Jamais la base de travail. */
export function testDatabaseUrl(): string {
  if (!process.env.DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");
  const source = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!source) throw new Error("DATABASE_URL (ou TEST_DATABASE_URL) doit être défini pour les tests.");
  const url = new URL(source);
  if (!process.env.TEST_DATABASE_URL) {
    const name = url.pathname.slice(1) || "doztra_learn";
    url.pathname = `/${name.endsWith("_test") ? name : `${name}_test`}`;
  }
  if (!url.pathname.endsWith("_test")) throw new Error("La base de test doit avoir un nom se terminant par _test.");
  return url.toString();
}
