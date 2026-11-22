import { config, type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faImage, faFileLines, faFilePdf } from "@fortawesome/free-regular-svg-icons";
import {
  faBookOpen,
  faChartSimple,
  faCirclePlay,
  faCode,
  faCube,
  faDatabase,
  faLayerGroup,
  faListCheck,
  faMobileScreen,
  faServer,
  faTerminal,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IconKey, LessonType } from "@/server/demo/data";
import type { CategoryIcon, LessonTypeValue } from "@/shared/courses";

// Ce module est chargé côté serveur ET dans le navigateur (composants clients) : sans ce réglage ici,
// Font Awesome injecterait côté client une balise <style> sans nonce, bloquée par la CSP.
// Les styles nécessaires sont importés une fois dans src/app/layout.tsx.
config.autoAddCss = false;

type IconProps = {
  icon: IconDefinition;
  /** Libellé en français pour une icône porteuse de sens ; sans libellé, l'icône est décorative. */
  label?: string;
  className?: string;
  spin?: boolean;
};

/** Icône Font Awesome Classic (Solid / Regular) accessible. */
export function Icon({ icon, label, className, spin }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      spin={spin}
      {...(label ? { "aria-label": label, role: "img", "aria-hidden": false } : { "aria-hidden": true })}
    />
  );
}

/** Icônes des cours et catégories (clés sérialisables venant des données). */
export const SUBJECT_ICONS: Record<IconKey, IconDefinition> = {
  code: faCode,
  server: faServer,
  "chart-simple": faChartSimple,
  database: faDatabase,
  "mobile-screen": faMobileScreen,
  terminal: faTerminal,
  cube: faCube,
  "layer-group": faLayerGroup,
  image: faImage,
};

/** Icône par type de leçon (correspondances fixes du skill UI). */
export const LESSON_ICONS: Record<LessonType, IconDefinition> = {
  video: faCirclePlay,
  text: faFileLines,
  pdf: faFilePdf,
  quiz: faListCheck,
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  video: "Vidéo",
  text: "Leçon textuelle",
  pdf: "Document PDF",
  quiz: "Quiz",
};

/** Icônes de catégorie stockées en base (classes Font Awesome de la liste blanche) → définitions SVG. */
export const CATEGORY_ICON_DEFS: Record<CategoryIcon, IconDefinition> = {
  "fa-solid fa-code": faCode,
  "fa-solid fa-server": faServer,
  "fa-solid fa-chart-simple": faChartSimple,
  "fa-solid fa-database": faDatabase,
  "fa-solid fa-mobile-screen": faMobileScreen,
  "fa-solid fa-terminal": faTerminal,
  "fa-solid fa-cube": faCube,
  "fa-solid fa-layer-group": faLayerGroup,
  "fa-regular fa-image": faImage,
  "fa-solid fa-book-open": faBookOpen,
};

/** Icône par type de leçon, valeurs de la base (TEXT, VIDEO…). */
export const LESSON_TYPE_ICONS: Record<LessonTypeValue, IconDefinition> = {
  TEXT: faFileLines,
  VIDEO: faCirclePlay,
  PDF: faFilePdf,
  QUIZ: faListCheck,
};
