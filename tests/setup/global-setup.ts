import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { Client } from "pg";

import { testDatabaseUrl } from "./test-database";

/** Crée la base de test si besoin, puis applique les migrations versionnées (jamais « db push »). */
export default async function globalSetup() {
  const url = new URL(testDatabaseUrl());
  const name = url.pathname.slice(1);

  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  // Le nom vient de notre propre URL et se termine par _test (vérifié) ; CREATE DATABASE n'accepte pas de paramètre.
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${name.replace(/"/g, "")}"`);
  await client.end();

  // CLI Prisma lancée directement par Node (pas de shell, arguments en tableau).
  execFileSync(process.execPath, [join(process.cwd(), "node_modules", "prisma", "build", "index.js"), "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: "ignore",
  });
}
