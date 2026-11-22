import { connection } from "next/server";

import { db } from "@/server/db";
import { logger } from "@/server/logger";

/**
 * Disponibilité : la base PostgreSQL répond. 503 sinon (aucun détail technique dans la réponse).
 * Redis et le stockage objet s'ajouteront ici quand ils seront utilisés.
 */
export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", checks: { database: "ok" } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : "inconnue" }, "health/ready : base indisponible");
    return Response.json({ status: "error", checks: { database: "error" } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
