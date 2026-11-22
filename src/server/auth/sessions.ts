import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { Role } from "@/generated/prisma/client";
import { db } from "@/server/db";

/*
 * Sessions côté serveur en PostgreSQL (décision du 22/11/2026, à la place de Redis).
 * Le cookie porte un jeton aléatoire de 32 octets ; la base n'en garde que le SHA-256 :
 * une fuite de la table ne permet pas d'usurper une session.
 */

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // F-02 : 7 jours glissants
export const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // « Se souvenir de moi » : 30 jours
/** On ne réécrit l'expiration qu'une fois par heure au plus (évite une écriture à chaque requête). */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  roles: Role[];
};

export async function createSession(userId: string, remember: boolean): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_TTL_MS : SESSION_TTL_MS));
  await db.session.create({ data: { id: hashToken(token), userId, remember, expiresAt } });
  return { token, expiresAt };
}

/** Utilisateur de la session si elle est valide (non expirée, compte actif) ; prolonge l'expiration glissante. */
export async function validateSessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token || token.length > 100) return null;
  const id = hashToken(token);
  const session = await db.session.findUnique({
    where: { id },
    select: {
      expiresAt: true,
      remember: true,
      lastSeenAt: true,
      user: { select: { id: true, firstName: true, lastName: true, status: true, roles: { select: { role: true } } } },
    },
  });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now || session.user.status !== "ACTIVE") {
    await db.session.deleteMany({ where: { id } });
    return null;
  }
  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({
      where: { id },
      data: { lastSeenAt: new Date(now), expiresAt: new Date(now + (session.remember ? REMEMBER_TTL_MS : SESSION_TTL_MS)) },
    });
  }
  const { user } = session;
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, roles: user.roles.map((r) => r.role) };
}

/** Déconnexion : la session est détruite en base, pas seulement le cookie. */
export async function revokeSession(token: string | undefined) {
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
}

/** Invalide toutes les sessions d'un utilisateur (réinitialisation du mot de passe, blocage). */
export async function revokeAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

/** Ménage des sessions expirées (appelé à la connexion). */
export async function purgeExpiredSessions() {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
