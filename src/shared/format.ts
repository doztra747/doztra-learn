// Utilitaires de formatage partagés (client et serveur). Affichage fr-GN, fuseau Africa/Conakry.

const gnf = new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 });

/** Montant en GNF (sans décimales). 0 → « Gratuit ». */
export function formatPrice(amount: number | bigint): string {
  if (amount === 0 || amount === BigInt(0)) return "Gratuit";
  return formatGnf(amount);
}

/** Montant en GNF, toujours chiffré (pour un total ou une réduction). Espace insécable : « GNF » ne passe jamais seul à la ligne. */
export function formatGnf(amount: number | bigint): string {
  return `${gnf.format(amount)} GNF`;
}

const dateFr = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Conakry",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Date JJ/MM/AAAA dans le fuseau Africa/Conakry. */
export function formatDate(iso: string | Date): string {
  return dateFr.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** Durée d'un cours : « 45 min », « 12 h », « 1 h 30 ». */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/** « 1 cours », « 3 cours », « 1 leçon », « 3 leçons »… */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}
