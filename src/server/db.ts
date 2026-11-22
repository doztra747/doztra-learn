import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/server/env";

/** Client Prisma unique ; conservé sur globalThis en développement pour survivre au rechargement à chaud. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  // getEnv() valide DATABASE_URL et ne cite jamais sa valeur en cas d'erreur.
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: getEnv().DATABASE_URL }) });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
