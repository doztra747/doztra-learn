import { z } from "zod";

/** RG-02 : 8 caractères minimum, au moins une lettre et un chiffre. Limite haute contre les abus (hachage coûteux). */
export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum.")
  .max(128, "128 caractères maximum.")
  .regex(/\p{L}/u, "Au moins une lettre.")
  .regex(/\d/, "Au moins un chiffre.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Adresse trop longue.")
  .pipe(z.email("Adresse e-mail invalide."));

export const loginSchema = z
  .object({
    email: emailSchema,
    // À la connexion on ne revalide pas RG-02 (un ancien mot de passe doit rester utilisable) : seulement des bornes.
    password: z.string().min(1, "Saisissez votre mot de passe.").max(128, "128 caractères maximum."),
    remember: z.literal("on").optional(),
    next: z.string().max(200).optional(),
  })
  .strict();

/**
 * Chemin de retour après connexion : uniquement un chemin interne (« /… »), jamais « //hôte » ni « /\hôte »
 * (redirections ouvertes).
 */
export function safeNextPath(next: string | undefined | null): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return undefined;
  return next;
}
