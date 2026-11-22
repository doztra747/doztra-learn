import "server-only";

import { z } from "zod";

/*
 * Variables d'environnement validées (CLAUDE.md, règle 7). L'application refuse de démarrer si une variable
 * obligatoire manque ou est invalide (vérification au démarrage dans src/instrumentation.ts).
 * Jamais de valeur de secret dans un message d'erreur : seuls les NOMS des variables fautives sont cités.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "doit être une URL postgresql://"),
  /** URL publique du site (contrôle d'origine, liens absolus). */
  APP_URL: z.url().default("http://localhost:3000"),
  /** true seulement derrière Nginx : l'IP réelle est alors lue dans X-Forwarded-For. */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))].join(", ");
    throw new Error(`Configuration invalide : vérifiez les variables d'environnement ${names} (voir .env.example).`);
  }
  cached = parsed.data;
  return cached;
}
