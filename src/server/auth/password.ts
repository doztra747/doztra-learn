import "server-only";

import { hash, verify } from "@node-rs/argon2";

/** Argon2id (skill sécurité : memoryCost ≥ 19 Mio, timeCost ≥ 2). */
// algorithm: 2 = Algorithm.Argon2id (« const enum » de la bibliothèque, non importable avec isolatedModules).
const ARGON2ID = 2;
const OPTIONS = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

let dummyHash: Promise<string> | undefined;

/**
 * Vérifie un mot de passe. Sans hachage (compte inconnu ou sans mot de passe), on vérifie quand même contre un
 * hachage factice : le temps de réponse ne révèle pas si l'e-mail existe.
 */
export async function verifyPassword(passwordHash: string | null | undefined, password: string): Promise<boolean> {
  if (!passwordHash) {
    dummyHash ??= hashPassword("compte-inexistant-0");
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  return verify(passwordHash, password).catch(() => false);
}
