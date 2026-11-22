import { execFileSync } from "node:child_process";

import { Client } from "pg";

import globalSetup from "../setup/global-setup";
import { testDatabaseUrl } from "../setup/test-database";
import { OWNER } from "./owner";

/** Base de test migrée, vidée, puis compte formateur créé par la vraie commande « owner:create » (RG-05). */
export default async function e2eGlobalSetup() {
  await globalSetup();
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  await client.query(
    'TRUNCATE TABLE "sessions", "login_attempts", "course_tags", "tags", "course_objectives", "lessons", "sections", "courses", "categories", "media", "user_roles", "users" CASCADE',
  );
  await client.end();

  execFileSync(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", "scripts/cli.mts", "owner:create", "--email", OWNER.email, "--first-name", "Test", "--last-name", "Formateur"],
    { env: { ...process.env, DATABASE_URL: testDatabaseUrl(), OWNER_PASSWORD: OWNER.password }, stdio: "ignore" },
  );
}
