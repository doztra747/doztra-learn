import { existsSync } from "node:fs";

import { defineConfig } from "prisma/config";

// La CLI Prisma ne lit pas .env d'elle-même : on le charge avec l'API native de Node (pas de dépendance dotenv).
if (existsSync(".env")) process.loadEnvFile(".env");

/*
 * URL utilisée par la CLI (migrations) :
 * - DATABASE_URL_UNPOOLED si elle existe (Neon sur Vercel) : connexion directe, nécessaire au verrou de migration ;
 * - sinon DATABASE_URL.
 * Absente (installation sans base, « prisma generate ») : la génération du client n'en a pas besoin.
 */
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  ...(url ? { datasource: { url } } : {}),
});
