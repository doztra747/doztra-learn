import "server-only";

import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

import { isDomainError } from "@/server/errors";
import type { ActionState } from "@/shared/action-state";

/** Erreurs de validation zod → message par champ (premier message de chaque champ). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

/** Valeurs texte d'un FormData (les fichiers sont ignorés : ils ne passent jamais par une action). */
export function formValues(formData: FormData, keys: readonly string[]): Record<string, string | undefined> {
  const values: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = formData.get(key);
    values[key] = typeof value === "string" ? value : undefined;
  }
  return values;
}

/**
 * Exécute une mutation et convertit les erreurs métier en état de formulaire.
 * Les erreurs inattendues remontent (error.tsx) : jamais de détail technique vers le client.
 */
export async function runAction(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (error) {
    unstable_rethrow(error); // redirect() / notFound() sont des exceptions de contrôle de Next.js
    if (isDomainError(error)) return { ok: false, message: error.message };
    throw error;
  }
}
