"use server";

import { redirect } from "next/navigation";

import { fieldErrorsOf, formValues, runAction } from "@/server/actions";
import { login } from "@/server/auth/auth.service";
import { clearSessionCookie, getClientIp, readSessionCookie, setSessionCookie } from "@/server/auth/dal";
import { revokeSession } from "@/server/auth/sessions";
import { logger } from "@/server/logger";
import type { ActionState } from "@/shared/action-state";
import { loginSchema, safeNextPath } from "@/shared/auth";

/** F-02 : connexion par e-mail et mot de passe ; redirige vers « next » (chemin interne) ou l'espace adapté au rôle. */
export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formValues(formData, ["email", "password", "remember", "next"]));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };

  let destination = "/";
  const result = await runAction(async () => {
    const session = await login({
      email: parsed.data.email,
      password: parsed.data.password,
      remember: parsed.data.remember === "on",
      ip: await getClientIp(),
    });
    await setSessionCookie(session.token, session.expiresAt, parsed.data.remember === "on");
    logger.info({ event: "login", userId: session.userId }, "connexion réussie");
    destination = safeNextPath(parsed.data.next) ?? (session.isOwner ? "/studio" : "/my-courses");
  });
  if (!result.ok) return result;
  redirect(destination);
}

/** Déconnexion : session détruite en base, cookie supprimé. */
export async function logoutAction(): Promise<void> {
  await revokeSession(await readSessionCookie());
  await clearSessionCookie();
  redirect("/login");
}
