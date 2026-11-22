/**
 * Exécuté une fois au démarrage du serveur Next.js : on valide la configuration avant de servir la moindre requête.
 * Une variable manquante arrête le démarrage avec un message qui nomme la variable (jamais sa valeur).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("@/server/env");
    getEnv();
  }
}
