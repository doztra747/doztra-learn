import "server-only";

import { hashPassword } from "@/server/auth/password";
import { db } from "@/server/db";
import { DomainError, isUniqueViolation } from "@/server/errors";

/**
 * RG-05 : crée l'unique compte formateur (OWNER). Appelé UNIQUEMENT par la commande « owner:create » :
 * aucune page, Server Action ni Route Handler ne peut attribuer OWNER. L'index unique partiel en base est le garde-fou final.
 * Les entrées sont validées par l'appelant (schémas de src/shared/auth.ts).
 */
export async function createOwner(input: { email: string; firstName: string; lastName: string; password: string }) {
  const existing = await db.userRole.findFirst({ where: { role: "OWNER" }, select: { userId: true } });
  if (existing) throw new DomainError("OWNER_EXISTS", "Un compte formateur existe déjà : il ne peut y en avoir qu'un.");

  const passwordHash = await hashPassword(input.password);
  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          // Le compte formateur est créé par l'administrateur du serveur : l'adresse est considérée comme vérifiée.
          emailVerifiedAt: new Date(),
        },
        select: { id: true, email: true },
      });
      await tx.userRole.create({ data: { userId: user.id, role: "OWNER" } });
      return user;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DomainError("OWNER_EXISTS", "Un compte formateur existe déjà, ou cette adresse e-mail est déjà utilisée.");
    }
    throw error;
  }
}
