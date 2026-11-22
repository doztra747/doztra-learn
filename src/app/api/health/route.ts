import { connection } from "next/server";

/** Vivacité : le processus répond. Toujours dynamique (jamais prérendu). */
export async function GET() {
  await connection();
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
