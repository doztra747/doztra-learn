// Crée le compte formateur sur la base de PRODUCTION (Neon, via Vercel), de façon interactive.
// 1. récupère les variables de production dans un fichier temporaire (ignoré par Git et par Vercel) ;
// 2. lance « owner:create » avec ces variables (mot de passe saisi sans affichage) ;
// 3. supprime toujours le fichier temporaire.
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

const envFile = ".env.production.owner.local";
// npx de l'installation Node courante, lancé directement par Node (pas de shell, arguments en tableau).
const npxCli = join(dirname(process.execPath), process.platform === "win32" ? "" : "../lib", "node_modules", "npm", "bin", "npx-cli.js");

try {
  console.log("Récupération des variables de production Vercel…");
  execFileSync(process.execPath, [npxCli, "--yes", "vercel@65.12.1", "env", "pull", envFile, "--environment", "production", "--yes"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  console.log("Connexion à la base de production.\n");
  execFileSync(
    process.execPath,
    [`--env-file=${envFile}`, "--conditions=react-server", "--import", "tsx", join("scripts", "cli.mts"), "owner:create", ...process.argv.slice(2)],
    {
      stdio: "inherit",
      // APP_URL et TRUST_PROXY sont des variables « sensibles » sur Vercel (illisibles depuis le poste) :
      // valeurs fournies ici ; seule DATABASE_URL vient du fichier récupéré.
      env: { ...process.env, APP_URL: "https://doztra-learn.vercel.app", TRUST_PROXY: "false" },
    },
  );
} catch {
  process.exitCode = 1;
} finally {
  if (existsSync(envFile)) rmSync(envFile);
}
