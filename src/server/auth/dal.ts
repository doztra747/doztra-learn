import "server-only";

import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { type SessionUser, validateSessionToken } from "@/server/auth/sessions";
import { getEnv } from "@/server/env";

/*
 * Couche d'accès (DAL). CHAQUE page protégée et CHAQUE Server Action l'appelle elle-même :
 * un layout ne protège rien et proxy.ts ne fait qu'une redirection optimiste.
 */

/** Préfixe __Host- : cookie limité à l'hôte exact, Secure et Path=/ obligatoires. */
export const SESSION_COOKIE = "__Host-dzl.sid";

/** Utilisateur connecté (mémoïsé pour la requête en cours, jamais mis en cache partagé). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return validateSessionToken(token);
});

/** Exige une connexion ; sinon renvoie vers la connexion avec un retour vers « next ». */
export async function requireUser(next = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * Espace formateur : exige le rôle OWNER. Un utilisateur connecté sans ce rôle reçoit une 404,
 * pour ne pas révéler l'existence du studio.
 */
export async function requireOwner(next = "/studio"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!user.roles.includes("OWNER")) notFound();
  return user;
}

/** Pose le cookie de session (uniquement dans une Server Action ou un Route Handler). */
export async function setSessionCookie(token: string, expiresAt: Date, remember: boolean) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true, // accepté par les navigateurs sur http://localhost
    sameSite: "lax",
    path: "/",
    // Sans « se souvenir de moi » : cookie de session du navigateur (la session serveur expire après 7 jours).
    ...(remember ? { expires: expiresAt } : {}),
  });
}

export async function readSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function clearSessionCookie() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/", secure: true, httpOnly: true, sameSite: "lax" });
}

/**
 * IP du client, seulement si elle est fiable : derrière Nginx (TRUST_PROXY=true), première valeur de X-Forwarded-For.
 * Sinon null : le verrouillage RG-04 se fait alors par e-mail seulement (pas de clé IP commune à tous).
 */
export async function getClientIp(): Promise<string | null> {
  if (!getEnv().TRUST_PROXY) return null;
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip.length <= 45 ? ip : null;
}
