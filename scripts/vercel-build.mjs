// Build sur Vercel : applique les migrations versionnées (jamais « db push ») uniquement en production,
// puis construit l'application. Les déploiements de prévisualisation ne modifient jamais la base de production.
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const run = (args) => execFileSync(process.execPath, args, { stdio: "inherit" });

if (process.env.VERCEL_ENV === "production") {
  console.log("Production : application des migrations Prisma…");
  run([join("node_modules", "prisma", "build", "index.js"), "migrate", "deploy"]);
} else {
  console.log(`Environnement « ${process.env.VERCEL_ENV ?? "local"} » : migrations non appliquées.`);
}
run([join("node_modules", "next", "dist", "bin", "next"), "build"]);
