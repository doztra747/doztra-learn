/*
 * Commandes d'administration du serveur. Usage : npm run cli -- <commande> [options]
 *
 *   owner:create   Crée l'unique compte formateur (RG-05). Demande les informations dans le terminal ;
 *                  le mot de passe est saisi sans être affiché, deux fois.
 *                  Options : --email <e-mail> --first-name <prénom> --last-name <nom>
 *                  Automatisation (tests, CI uniquement) : mot de passe dans la variable OWNER_PASSWORD.
 *
 * Lancé avec « --conditions=react-server » pour que les modules « server-only » soient importables.
 */
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

import { z } from "zod";

if (existsSync(".env") && !process.env.DATABASE_URL) process.loadEnvFile(".env");

const { db } = await import("@/server/db");
const { isDomainError } = await import("@/server/errors");
const { createOwner } = await import("@/server/users/users.service");
const { emailSchema, passwordSchema } = await import("@/shared/auth");

const nameSchema = z.string().trim().min(1, "Champ obligatoire.").max(80, "80 caractères maximum.");

function ask(question: string, { hidden = false } = {}): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // Masque la saisie : seul le libellé de la question est affiché.
    const internal = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    internal._writeToOutput = (s: string) => {
      if (s.startsWith(question)) internal.output.write(question);
      else if (s.includes("\n") || s.includes("\r")) internal.output.write("\n");
    };
  }
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function askValid<T>(question: string, schema: z.ZodType<T>, preset?: string, hidden = false): Promise<T> {
  if (preset !== undefined) {
    const parsed = schema.safeParse(preset);
    if (!parsed.success) throw new Error(`${question.trim()} ${parsed.error.issues[0].message}`);
    return parsed.data;
  }
  for (;;) {
    const parsed = schema.safeParse(await ask(question, { hidden }));
    if (parsed.success) return parsed.data;
    console.error(`  ✗ ${parsed.error.issues.map((i) => i.message).join(" ")}`);
  }
}

async function ownerCreate(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: { email: { type: "string" }, "first-name": { type: "string" }, "last-name": { type: "string" } },
    strict: true,
  });

  console.log("Création du compte formateur (unique sur la plateforme).");
  const email = await askValid("E-mail : ", emailSchema, values.email);
  const firstName = await askValid("Prénom : ", nameSchema, values["first-name"]);
  const lastName = await askValid("Nom : ", nameSchema, values["last-name"]);

  let password: string;
  if (process.env.OWNER_PASSWORD !== undefined) {
    password = await askValid("Mot de passe (OWNER_PASSWORD) :", passwordSchema, process.env.OWNER_PASSWORD);
  } else {
    for (;;) {
      password = await askValid("Mot de passe (8 caractères min., une lettre et un chiffre) : ", passwordSchema, undefined, true);
      if ((await ask("Confirmez le mot de passe : ", { hidden: true })) === password) break;
      console.error("  ✗ Les deux mots de passe ne correspondent pas.");
    }
  }

  const owner = await createOwner({ email, firstName, lastName, password });
  console.log(`✓ Compte formateur créé pour ${owner.email}. Connectez-vous sur /login.`);
}

const [command, ...rest] = process.argv.slice(2);
try {
  if (command === "owner:create") await ownerCreate(rest);
  else {
    console.error(`Commande inconnue : ${command ?? "(aucune)"}. Commandes disponibles : owner:create`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`✗ ${isDomainError(error) || error instanceof Error ? error.message : "Erreur inattendue."}`);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
