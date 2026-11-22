import "server-only";

/*
 * Données de démonstration reprises du prototype (docs/prototype/Doztra-Learn.dc.html).
 * Depuis la phase 1, le catalogue, les fiches cours et le studio lisent PostgreSQL.
 * Ce fichier ne sert plus qu'aux écrans apprenant sans données réelles : lecteur, mes cours, certificats
 * (branchés en phases 3 et 6). Ne pas enrichir ; supprimer chaque partie dès que son domaine est branché.
 */

export type Level = "Débutant" | "Intermédiaire" | "Avancé";
export type LessonType = "video" | "text" | "pdf" | "quiz";
/** Clé d'icône résolue par src/components/icon.tsx (données sérialisables). */
export type IconKey =
  | "code"
  | "server"
  | "chart-simple"
  | "database"
  | "mobile-screen"
  | "terminal"
  | "cube"
  | "layer-group"
  | "image";

export type Course = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  level: Level;
  /** Prix en GNF ; 0 = gratuit. */
  price: number;
  compareAtPrice?: number;
  rating: string;
  reviewCount: number;
  lessonCount: number;
  duration: string;
  icon: IconKey;
  /** Couleurs de la vignette (jetons du prototype). */
  tone: "forest" | "terracotta" | "gold" | "sand" | "forest-sand" | "sand-terracotta";
};

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  isFreePreview?: boolean;
};

export type Section = { title: string; lessons: Lesson[] };

export type CodeToken = { text: string; kind: "keyword" | "ident" | "punct" | "string" | "number" | "fn" | "comment" };

export type Certificate = {
  code: string;
  fullName: string;
  courseSlug: string;
  issuedAt: string;
};

export const COURSES: Course[] = [
  { slug: "javascript-moderne", title: "JavaScript moderne : de zéro à l'autonomie", category: "Développement web", level: "Débutant", price: 250000, compareAtPrice: 350000, rating: "4,8", reviewCount: 312, lessonCount: 42, duration: "12 h", icon: "code", tone: "forest", subtitle: "Variables, fonctions, DOM et projets concrets pour écrire du JavaScript propre et sûr." },
  { slug: "api-rest-nestjs-postgresql", title: "API REST avec NestJS et PostgreSQL", category: "Back-end", level: "Intermédiaire", price: 450000, rating: "4,9", reviewCount: 128, lessonCount: 56, duration: "18 h", icon: "server", tone: "terracotta", subtitle: "Concevez, sécurisez et déployez une API professionnelle de bout en bout." },
  { slug: "python-analyse-donnees", title: "Python pour l'analyse de données", category: "Data", level: "Débutant", price: 0, rating: "4,7", reviewCount: 540, lessonCount: 30, duration: "8 h", icon: "chart-simple", tone: "gold", subtitle: "Pandas, graphiques et nettoyage de données sur des jeux réels." },
  { slug: "sql-en-pratique", title: "Bases de données SQL en pratique", category: "Data", level: "Intermédiaire", price: 200000, rating: "4,6", reviewCount: 201, lessonCount: 34, duration: "10 h", icon: "database", tone: "sand", subtitle: "Requêtes, jointures, index et modélisation avec PostgreSQL." },
  { slug: "flutter-premiere-app", title: "Flutter : votre première application mobile", category: "Mobile", level: "Débutant", price: 300000, compareAtPrice: 400000, rating: "4,7", reviewCount: 96, lessonCount: 38, duration: "11 h", icon: "mobile-screen", tone: "terracotta", subtitle: "Créez et publiez une application Android et iOS avec Dart." },
  { slug: "linux-bash", title: "Linux et Bash pour développeurs", category: "DevOps", level: "Débutant", price: 0, rating: "4,8", reviewCount: 410, lessonCount: 24, duration: "6 h", icon: "terminal", tone: "forest-sand", subtitle: "Le terminal sans peur : fichiers, droits, scripts et SSH." },
  { slug: "docker-production", title: "Docker et déploiement en production", category: "DevOps", level: "Avancé", price: 400000, rating: "4,9", reviewCount: 74, lessonCount: 40, duration: "14 h", icon: "cube", tone: "sand-terracotta", subtitle: "Conteneurs, Compose, Nginx et CI pour livrer en toute confiance." },
  { slug: "typescript-avance", title: "TypeScript avancé", category: "Développement web", level: "Avancé", price: 350000, rating: "4,8", reviewCount: 88, lessonCount: 32, duration: "9 h", icon: "layer-group", tone: "gold", subtitle: "Génériques, types conditionnels et architecture typée." },
];

/** Programme de démonstration (identique pour tous les cours dans le prototype). */
export const PROGRAM: Section[] = [
  { title: "Prise en main", lessons: [
    { id: "l1", title: "Bienvenue dans le cours", type: "video", duration: "4:12", isFreePreview: true },
    { id: "l2", title: "Installer Node.js et VS Code", type: "text", duration: "6 min", isFreePreview: true },
    { id: "l3", title: "Variables et types", type: "text", duration: "9 min" },
  ] },
  { title: "Les fondamentaux", lessons: [
    { id: "l4", title: "Fonctions et portée", type: "video", duration: "14:30" },
    { id: "l5", title: "Fiche mémo : syntaxe ES2024", type: "pdf", duration: "12 pages" },
    { id: "l6", title: "Quiz : les fondamentaux", type: "quiz", duration: "5 questions" },
  ] },
  { title: "Le DOM et les événements", lessons: [
    { id: "l7", title: "Sélectionner des éléments", type: "video", duration: "12:05" },
    { id: "l8", title: "Projet : une liste de tâches", type: "text", duration: "18 min" },
    { id: "l9", title: "Quiz final", type: "quiz", duration: "10 questions" },
  ] },
];

/** Leçons déjà terminées par l'apprenant de démonstration. */
export const DEMO_DONE_LESSONS = ["l1", "l2"];

export const DEMO_LEARNER = { firstName: "Aïssatou", fullName: "Aïssatou Diallo", initials: "AD" };

export const DEMO_CODE: { filename: string; language: string; highlightLine: number; lines: CodeToken[][] } = {
  filename: "variables.js",
  language: "JavaScript",
  highlightLine: 5,
  lines: [
    [{ text: "// Déclarer une constante et une variable", kind: "comment" }],
    [{ text: "const ", kind: "keyword" }, { text: "prenom", kind: "ident" }, { text: " = ", kind: "punct" }, { text: '"Aïssatou"', kind: "string" }, { text: ";", kind: "punct" }],
    [{ text: "let ", kind: "keyword" }, { text: "age", kind: "ident" }, { text: " = ", kind: "punct" }, { text: "24", kind: "number" }, { text: ";", kind: "punct" }],
    [],
    [{ text: "age", kind: "ident" }, { text: " = ", kind: "punct" }, { text: "age", kind: "ident" }, { text: " + ", kind: "punct" }, { text: "1", kind: "number" }, { text: ";", kind: "punct" }, { text: "  // réassignation autorisée", kind: "comment" }],
    [{ text: "console", kind: "ident" }, { text: ".", kind: "punct" }, { text: "log", kind: "fn" }, { text: "(", kind: "punct" }, { text: "`${prenom} a ${age} ans`", kind: "string" }, { text: ");", kind: "punct" }],
    [],
    [{ text: "prenom", kind: "ident" }, { text: " = ", kind: "punct" }, { text: '"Mariama"', kind: "string" }, { text: ";", kind: "punct" }, { text: "  // TypeError", kind: "comment" }],
  ],
};

export const DEMO_QUIZ = {
  question: "Que se passe-t-il à l'exécution de ce code ?",
  code: [
    [{ text: "const ", kind: "keyword" }, { text: "x", kind: "ident" }, { text: " = ", kind: "punct" }, { text: "5", kind: "number" }, { text: ";", kind: "punct" }],
    [{ text: "x", kind: "ident" }, { text: " = ", kind: "punct" }, { text: "6", kind: "number" }, { text: ";", kind: "punct" }],
  ] as CodeToken[][],
  options: [
    { key: "a", text: "x vaut 6" },
    { key: "b", text: "Une TypeError est levée" },
    { key: "c", text: "x vaut toujours 5, sans erreur" },
    { key: "d", text: "undefined s'affiche dans la console" },
  ],
  // Démonstration uniquement : en production, la bonne réponse n'est jamais envoyée au navigateur (RG-42).
  answer: "b",
  explanationRight: "Une variable déclarée avec const ne peut pas être réassignée : JavaScript lève une TypeError.",
  explanationWrong: "Une constante ne peut pas être réassignée : la réponse est B.",
};

export const DEMO_ENROLLMENTS = [
  { courseSlug: "javascript-moderne", progress: 22, lastLesson: "Variables et types", status: "progress" as const },
  { courseSlug: "python-analyse-donnees", progress: 64, lastLesson: "Nettoyer un jeu de données", status: "progress" as const },
  { courseSlug: "sql-en-pratique", progress: 100, lastLesson: "Terminé le 14/10/2026", status: "done" as const },
  { courseSlug: "linux-bash", progress: 100, lastLesson: "Terminé le 02/09/2026", status: "done" as const },
];

export const CERTIFICATES: Certificate[] = [
  { code: "DZL-7K2F-91QA", fullName: "Aïssatou Diallo", courseSlug: "sql-en-pratique", issuedAt: "2026-10-14T10:00:00Z" },
  { code: "DZL-3PX8-LM04", fullName: "Aïssatou Diallo", courseSlug: "linux-bash", issuedAt: "2026-09-02T10:00:00Z" },
];

// --- Accès (forme des futurs services) ---

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function findLesson(lessonId: string) {
  const flat = PROGRAM.flatMap((section) => section.lessons.map((lesson) => ({ ...lesson, section: section.title })));
  const index = flat.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;
  return { lesson: flat[index], previous: flat[index - 1], next: flat[index + 1] };
}

export function getCertificate(code: string): Certificate | undefined {
  return CERTIFICATES.find((c) => c.code === code.trim().toUpperCase());
}
