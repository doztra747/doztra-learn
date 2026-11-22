import { INVALID_CREDENTIALS, LOCK_MS, lockedUntil, login, MAX_FAILURES } from "@/server/auth/auth.service";
import { hashToken, revokeSession, validateSessionToken } from "@/server/auth/sessions";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import { createOwner } from "@/server/users/users.service";
import { passwordSchema, safeNextPath } from "@/shared/auth";
import { resetDatabase } from "../../../tests/factories";

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

const OWNER = { email: "formateur@exemple.test", firstName: "Ibrahima", lastName: "Bayo", password: "motdepasse1" };

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  return promise.then(
    () => undefined,
    (e: unknown) => (e instanceof DomainError ? e.code : "AUTRE"),
  );
}

describe("RG-02 : mot de passe", () => {
  it("RG-02 : accepte 8 caractères avec une lettre et un chiffre", () => {
    expect(passwordSchema.safeParse("abcdefg1").success).toBe(true);
    expect(passwordSchema.safeParse("éèàçùâê9").success).toBe(true);
  });

  it("RG-02 : refuse trop court, sans chiffre ou sans lettre", () => {
    expect(passwordSchema.safeParse("abc1").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("RG-02 : le mot de passe est stocké haché en Argon2id, jamais en clair", async () => {
    await createOwner(OWNER);
    const user = await db.user.findUniqueOrThrow({ where: { email: OWNER.email } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(user.passwordHash).not.toContain(OWNER.password);
  });
});

describe("RG-05 : un seul formateur", () => {
  it("RG-05 : crée le formateur avec le rôle OWNER", async () => {
    const owner = await createOwner(OWNER);
    const roles = await db.userRole.findMany({ where: { userId: owner.id } });
    expect(roles.map((r) => r.role)).toEqual(["OWNER"]);
  });

  it("RG-05 : refuse un second formateur", async () => {
    await createOwner(OWNER);
    expect(await codeOf(createOwner({ ...OWNER, email: "autre@exemple.test" }))).toBe("OWNER_EXISTS");
  });
});

describe("F-02 : connexion et sessions", () => {
  beforeEach(() => createOwner(OWNER));

  it("ouvre une session ; seul le haché du jeton est stocké", async () => {
    const result = await login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null });
    expect(result.isOwner).toBe(true);
    const stored = await db.session.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(hashToken(result.token));
    expect(stored[0].id).not.toBe(result.token);
    const user = await validateSessionToken(result.token);
    expect(user?.roles).toEqual(["OWNER"]);
  });

  it("« se souvenir de moi » prolonge la session à 30 jours", async () => {
    const short = await login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null });
    const long = await login({ email: OWNER.email, password: OWNER.password, remember: true, ip: null });
    const days = (d: Date) => Math.round((d.getTime() - Date.now()) / 86_400_000);
    expect([days(short.expiresAt), days(long.expiresAt)]).toEqual([7, 30]);
  });

  it("même message pour un e-mail inconnu et un mauvais mot de passe", async () => {
    const unknown = await login({ email: "inconnu@exemple.test", password: "x", remember: false, ip: null }).catch((e: DomainError) => e.message);
    const wrong = await login({ email: OWNER.email, password: "mauvais1", remember: false, ip: null }).catch((e: DomainError) => e.message);
    expect(unknown).toBe(INVALID_CREDENTIALS);
    expect(wrong).toBe(INVALID_CREDENTIALS);
  });

  it("la session expirée est refusée et supprimée ; la déconnexion détruit la session", async () => {
    const a = await login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null });
    await db.session.update({ where: { id: hashToken(a.token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await validateSessionToken(a.token)).toBeNull();
    expect(await db.session.count()).toBe(0);

    const b = await login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null });
    await revokeSession(b.token);
    expect(await validateSessionToken(b.token)).toBeNull();
  });

  it("un compte bloqué ne peut pas se connecter et perd ses sessions", async () => {
    const a = await login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null });
    await db.user.update({ where: { email: OWNER.email }, data: { status: "BANNED" } });
    expect(await validateSessionToken(a.token)).toBeNull();
    expect(await codeOf(login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null }))).toBe("ACCOUNT_BANNED");
  });

  it("refuse un jeton forgé ou absent", async () => {
    expect(await validateSessionToken(undefined)).toBeNull();
    expect(await validateSessionToken("jeton-invente")).toBeNull();
  });
});

describe("RG-04 : verrouillage après 5 échecs en 15 minutes", () => {
  beforeEach(() => createOwner(OWNER));

  const fail = (email: string, ip: string | null) => login({ email, password: "mauvais1", remember: false, ip }).catch(() => undefined);

  it("RG-04 : le 6e essai est refusé même avec le bon mot de passe", async () => {
    for (let i = 0; i < MAX_FAILURES; i++) await fail(OWNER.email, null);
    expect(await codeOf(login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null }))).toBe("ACCOUNT_LOCKED");
  });

  it("RG-04 : 4 échecs puis une connexion réussie remettent le compteur à zéro", async () => {
    for (let i = 0; i < MAX_FAILURES - 1; i++) await fail(OWNER.email, null);
    await login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null });
    for (let i = 0; i < MAX_FAILURES - 1; i++) await fail(OWNER.email, null);
    expect(await codeOf(login({ email: OWNER.email, password: OWNER.password, remember: false, ip: null }))).toBeUndefined();
  });

  it("RG-04 : compté aussi par IP (5 e-mails différents depuis la même IP)", async () => {
    for (let i = 0; i < MAX_FAILURES; i++) await fail(`inconnu${i}@exemple.test`, "203.0.113.7");
    expect(await codeOf(login({ email: OWNER.email, password: OWNER.password, remember: false, ip: "203.0.113.7" }))).toBe("ACCOUNT_LOCKED");
    // Une autre IP n'est pas bloquée.
    expect(await codeOf(login({ email: OWNER.email, password: OWNER.password, remember: false, ip: "198.51.100.1" }))).toBeUndefined();
  });

  it("RG-04 : aucune donnée en clair dans les compteurs", async () => {
    await fail(OWNER.email, "203.0.113.7");
    const rows = await db.loginAttempt.findMany();
    expect(rows.every((r) => /^[0-9a-f]{64}$/.test(r.keyHash))).toBe(true);
    expect(JSON.stringify(rows)).not.toContain("203.0.113.7");
  });

  it("RG-04 : le blocage dure 15 minutes à partir du 5e échec", () => {
    const t0 = Date.UTC(2026, 10, 22, 10, 0);
    const failures = [0, 1, 2, 3, 4].map((m) => new Date(t0 + m * 60_000)); // 5e échec à 10 h 04
    expect(lockedUntil(failures, t0 + 5 * 60_000)?.getTime()).toBe(t0 + 4 * 60_000 + LOCK_MS);
    expect(lockedUntil(failures, t0 + 18 * 60_000)).not.toBeNull(); // 10 h 18 : encore bloqué
    expect(lockedUntil(failures, t0 + 19 * 60_000 + 1)).toBeNull(); // 10 h 19 passées : débloqué
  });

  it("RG-04 : 5 échecs étalés sur plus de 15 minutes ne bloquent pas", () => {
    const t0 = Date.UTC(2026, 10, 22, 10, 0);
    const failures = [0, 4, 8, 12, 16].map((m) => new Date(t0 + m * 60_000));
    expect(lockedUntil(failures, t0 + 17 * 60_000)).toBeNull();
  });
});

describe("Retour après connexion (redirection ouverte)", () => {
  it("n'accepte que des chemins internes", () => {
    expect(safeNextPath("/studio/courses")).toBe("/studio/courses");
    expect(safeNextPath("//evil.example")).toBeUndefined();
    expect(safeNextPath("/\\evil.example")).toBeUndefined();
    expect(safeNextPath("https://evil.example")).toBeUndefined();
    expect(safeNextPath(undefined)).toBeUndefined();
  });
});
