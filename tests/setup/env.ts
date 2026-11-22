import { testDatabaseUrl } from "./test-database";

// Les services lisent DATABASE_URL : dans les tests, elle pointe toujours sur la base de test.
process.env.DATABASE_URL = testDatabaseUrl();
