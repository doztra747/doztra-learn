import "server-only";

import { createHash } from "node:crypto";

import { verifyPassword } from "@/server/auth/password";
import { createSession, purgeExpiredSessions } from "@/server/auth/sessions";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";

/*
 * Connexion (F-02) et verrouillage RG-04 : 5 échecs en 15 minutes bloquent 15 minutes,
 * comptés par e-mail ET par IP. Les compteurs vivent en PostgreSQL (table login_attempts, clés hachées).
 */

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const LOCK_MS = 15 * 60 * 1000;

/** Message unique : ne révèle jamais si l'e-mail existe. */
export const INVALID_CREDENTIALS = "E-mail ou mot de passe incorrect.";

const keyOf = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Verrouillé si 5 échecs se sont produits en 15 minutes ou moins ET que le 5e date de moins de 15 minutes :
 * le blocage dure bien 15 minutes à partir du 5e échec.
 */
export function lockedUntil(failures: Date[], now: number): Date | null {
  const times = failures.map((d) => d.getTime()).sort((a, b) => a - b);
  let until: number | null = null;
  for (let i = 0; i + MAX_FAILURES - 1 < times.length; i++) {
    const fifth = times[i + MAX_FAILURES - 1];
    if (fifth - times[i] <= WINDOW_MS && now - fifth < LOCK_MS) until = Math.max(until ?? 0, fifth + LOCK_MS);
  }
  return until === null ? null : new Date(until);
}

async function lockStatus(scope: "EMAIL" | "IP", keyHash: string, now: number) {
  const rows = await db.loginAttempt.findMany({
    where: { scope, keyHash, createdAt: { gte: new Date(now - WINDOW_MS - LOCK_MS) } },
    select: { createdAt: true },
  });
  return lockedUntil(rows.map((r) => r.createdAt), now);
}

async function recordFailure(keys: { scope: "EMAIL" | "IP"; keyHash: string }[]) {
  await db.loginAttempt.createMany({ data: keys });
  // Ménage : les échecs de plus d'un jour ne servent plus.
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}

export type LoginResult = { token: string; expiresAt: Date; userId: string; isOwner: boolean };

/**
 * Vérifie les identifiants et ouvre une session.
 * @param ip IP du client si elle est connue de façon fiable (derrière Nginx) ; sinon null et seul l'e-mail est compté.
 */
export async function login(input: { email: string; password: string; remember: boolean; ip: string | null }): Promise<LoginResult> {
  const now = Date.now();
  const keys = [
    { scope: "EMAIL" as const, keyHash: keyOf(input.email.toLowerCase()) },
    ...(input.ip ? [{ scope: "IP" as const, keyHash: keyOf(input.ip) }] : []),
  ];

  for (const key of keys) {
    if (await lockStatus(key.scope, key.keyHash, now)) {
      throw new DomainError("ACCOUNT_LOCKED", "Trop de tentatives de connexion. Réessayez dans 15 minutes.", undefined, 429);
    }
  }

  const user = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true, status: true, roles: { select: { role: true } } },
  });
  const valid = await verifyPassword(user?.passwordHash, input.password);

  if (!user || !valid) {
    await recordFailure(keys);
    throw new DomainError("INVALID_CREDENTIALS", INVALID_CREDENTIALS, undefined, 401);
  }
  if (user.status !== "ACTIVE") {
    throw new DomainError("ACCOUNT_BANNED", "Ce compte est bloqué. Contactez le support.", undefined, 403);
  }

  // Succès : les échecs liés à cet e-mail sont effacés.
  await db.loginAttempt.deleteMany({ where: { scope: "EMAIL", keyHash: keys[0].keyHash } });
  await purgeExpiredSessions();
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const session = await createSession(user.id, input.remember);
  return { ...session, userId: user.id, isOwner: user.roles.some((r) => r.role === "OWNER") };
}
