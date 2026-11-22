import "server-only";

import pino from "pino";

/**
 * Journaux structurés (JSON). Jamais de secret ni de donnée personnelle :
 * les champs sensibles sont masqués même s'ils sont passés par erreur.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "test" ? "silent" : "info"),
  base: { app: "doztra-learn" },
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "email",
      "*.email",
      "phone",
      "*.phone",
      "cookie",
      "*.cookie",
      "authorization",
      "*.authorization",
      "headers.cookie",
      "headers.authorization",
    ],
    censor: "[masqué]",
  },
});
