import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  // Base de test dédiée (doztra_learn_test), migrée avant la suite : voir tests/setup/global-setup.ts.
  globalSetup: "<rootDir>/tests/setup/global-setup.ts",
  setupFiles: ["<rootDir>/tests/setup/env.ts"],
  moduleNameMapper: {
    // « server-only » lève une erreur hors des Server Components : neutre dans les tests de services.
    "^server-only$": "<rootDir>/tests/setup/empty.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  // Une seule base partagée : les fichiers de test s'exécutent l'un après l'autre.
  maxWorkers: 1,
  collectCoverageFrom: ["src/server/**/*.service.ts"],
};

export default createJestConfig(config);
