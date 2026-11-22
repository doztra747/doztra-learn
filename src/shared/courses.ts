import { z } from "zod";

/*
 * Schémas d'entrée et libellés partagés (client + serveur) pour les cours, sections, leçons et catégories.
 * Le serveur revalide toujours : ces schémas sont la source unique des limites.
 */

export const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const COURSE_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
export const LESSON_TYPES = ["TEXT", "VIDEO", "PDF", "QUIZ"] as const;

export type CourseLevelValue = (typeof COURSE_LEVELS)[number];
export type CourseStatusValue = (typeof COURSE_STATUSES)[number];
export type LessonTypeValue = (typeof LESSON_TYPES)[number];

export const LEVEL_LABELS: Record<CourseLevelValue, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export const STATUS_LABELS: Record<CourseStatusValue, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Programmé",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export const LESSON_TYPE_NAMES: Record<LessonTypeValue, string> = {
  TEXT: "Texte",
  VIDEO: "Vidéo",
  PDF: "PDF",
  QUIZ: "Quiz",
};

/** Icônes de catégorie autorisées (Font Awesome Classic) : la base ne stocke que ces classes. */
export const CATEGORY_ICONS = [
  "fa-solid fa-code",
  "fa-solid fa-server",
  "fa-solid fa-chart-simple",
  "fa-solid fa-database",
  "fa-solid fa-mobile-screen",
  "fa-solid fa-terminal",
  "fa-solid fa-cube",
  "fa-solid fa-layer-group",
  "fa-regular fa-image",
  "fa-solid fa-book-open",
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_LABELS: Record<CategoryIcon, string> = {
  "fa-solid fa-code": "Code",
  "fa-solid fa-server": "Serveur",
  "fa-solid fa-chart-simple": "Graphique",
  "fa-solid fa-database": "Base de données",
  "fa-solid fa-mobile-screen": "Mobile",
  "fa-solid fa-terminal": "Terminal",
  "fa-solid fa-cube": "Conteneur",
  "fa-solid fa-layer-group": "Couches",
  "fa-regular fa-image": "Image",
  "fa-solid fa-book-open": "Livre",
};

/** Limite de montant : 1 milliard de GNF, bien au-delà de tout prix réaliste. */
const MAX_PRICE = 1_000_000_000;

/** Texte saisi : espaces retirés ; champ vide → undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

/** Montant GNF saisi librement (« 250 000 », « 250000 ») → entier. */
const gnfAmount = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s  .]/g, ""))
  .pipe(z.string().regex(/^\d{1,10}$/, "Montant invalide : chiffres uniquement, sans décimales."))
  .transform((v) => Number(v))
  .pipe(z.number().int().min(0).max(MAX_PRICE, "Montant trop élevé."));

/** Une ligne par élément, lignes vides ignorées. */
const lines = (maxItems: number, maxLength: number) =>
  z
    .string()
    .max(maxItems * (maxLength + 2))
    .transform((v) =>
      v
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(maxLength, `${maxLength} caractères maximum par ligne.`)).max(maxItems, `${maxItems} éléments maximum.`));

export const courseCreateSchema = z
  .object({
    title: z.string().trim().min(3, "Le titre doit faire au moins 3 caractères.").max(160, "160 caractères maximum."),
    categoryId: z.uuid("Catégorie invalide.").optional().or(z.literal("").transform(() => undefined)),
    level: z.enum(COURSE_LEVELS, "Niveau invalide."),
  })
  .strict();

export const courseInfoSchema = z
  .object({
    title: z.string().trim().min(3, "Le titre doit faire au moins 3 caractères.").max(160, "160 caractères maximum."),
    subtitle: optionalText(240),
    categoryId: z.uuid("Catégorie invalide.").optional().or(z.literal("").transform(() => undefined)),
    level: z.enum(COURSE_LEVELS, "Niveau invalide."),
    description: optionalText(5000),
    objectives: lines(12, 200),
    prerequisites: lines(12, 200),
  })
  .strict();

export const coursePricingSchema = z
  .object({
    free: z.literal("on").optional(),
    price: gnfAmount.optional().or(z.literal("").transform(() => undefined)),
    compareAtPrice: gnfAmount.optional().or(z.literal("").transform(() => undefined)),
  })
  .strict()
  // Un prix saisi avec « Cours gratuit » coché serait ignoré en silence : on refuse la contradiction.
  .refine((v) => !(v.free && (v.price ?? 0) > 0), {
    message: "Décochez « Cours gratuit » pour fixer un prix.",
    path: ["free"],
  })
  .transform((v) => ({
    price: v.free ? 0 : (v.price ?? 0),
    compareAtPrice: v.free ? undefined : v.compareAtPrice,
  }))
  .refine((v) => v.compareAtPrice === undefined || v.compareAtPrice > v.price, {
    message: "Le prix barré doit être supérieur au prix.",
    path: ["compareAtPrice"],
  });

export const sectionTitleSchema = z.string().trim().min(1, "Donnez un titre à la section.").max(160, "160 caractères maximum.");
export const lessonTitleSchema = z.string().trim().min(1, "Donnez un titre à la leçon.").max(160, "160 caractères maximum.");
export const lessonTypeSchema = z.enum(LESSON_TYPES, "Type de leçon invalide.");
export const idSchema = z.uuid("Identifiant invalide.");

export const categorySchema = z
  .object({
    name: z.string().trim().min(2, "2 caractères minimum.").max(80, "80 caractères maximum."),
    icon: z.enum(CATEGORY_ICONS, "Icône invalide."),
    parentId: z.uuid("Catégorie parente invalide.").optional().or(z.literal("").transform(() => undefined)),
  })
  .strict();

/**
 * Slug à partir d'un titre (RG-16) : minuscules, sans accents, tirets.
 * « JavaScript moderne : de zéro à l'autonomie » → « javascript-moderne-de-zero-a-l-autonomie ».
 */
export function slugify(input: string, maxLength = 170): string {
  const slug = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "cours";
}

/** Convertit un texte brut en document Tiptap (un paragraphe par bloc séparé d'une ligne vide). */
export function textToTiptap(text: string) {
  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean);
  return {
    type: "doc",
    content: paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })),
  };
}

/** Texte brut d'un document Tiptap simple (paragraphes de texte) ; ignore tout le reste. */
export function tiptapToText(doc: unknown): string {
  if (!doc || typeof doc !== "object" || !("content" in doc) || !Array.isArray(doc.content)) return "";
  return doc.content
    .map((block: unknown) => {
      if (!block || typeof block !== "object" || !("content" in block) || !Array.isArray(block.content)) return "";
      return block.content
        .map((node: unknown) => (node && typeof node === "object" && "text" in node && typeof node.text === "string" ? node.text : ""))
        .join("");
    })
    .filter(Boolean)
    .join("\n\n");
}
