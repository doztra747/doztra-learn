import { faGraduationCap, faImage } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

import { Icon } from "@/components/icon";
import type { Course } from "@/server/demo/data";

/** Classes communes des boutons et liens-boutons (variantes du prototype). */
export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-900 hover:text-white",
  accent:
    "inline-flex items-center justify-center gap-2 rounded-full bg-gold px-[22px] py-3.5 text-[15px] font-bold text-forest transition-colors hover:bg-gold-600 hover:text-forest",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-full border border-[#D9CFBF] bg-white px-4 py-2.5 text-sm font-bold text-forest transition-colors hover:border-forest hover:text-forest",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full border border-[#D9CFBF] bg-transparent px-[22px] py-3.5 text-[15px] font-bold text-forest transition-colors hover:border-forest hover:text-forest",
  block:
    "flex w-full items-center justify-center gap-2 rounded-md bg-forest p-4 text-base font-bold text-white transition-colors hover:bg-forest-900 disabled:cursor-not-allowed disabled:opacity-60",
  blockOutline:
    "flex w-full items-center justify-center gap-2 rounded-md border border-[#D9CFBF] bg-white p-3.5 text-[15px] font-bold text-forest transition-colors hover:border-forest",
  square:
    "inline-grid size-[42px] shrink-0 place-items-center rounded-base border border-line bg-white text-forest transition-colors hover:border-forest",
} as const;

/** Champ de formulaire du prototype (fond paper, rayon 12 px, texte 16 px pour éviter le zoom iOS). */
export const inputStyles =
  "w-full rounded-base border border-line-strong bg-paper p-3.5 text-base text-ink placeholder:text-subtle";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-[34px] rounded-[10px]" : "size-[38px] rounded-[11px] text-[17px]";
  return (
    <span className="flex items-center gap-2.5">
      <span className={`grid place-items-center bg-forest text-gold ${box}`}>
        <Icon icon={faGraduationCap} />
      </span>
      <span className={`font-extrabold tracking-tight text-forest ${size === "sm" ? "text-[17px]" : "text-[19px]"}`}>
        Doztra<span className="text-terracotta">-</span>Learn
      </span>
    </span>
  );
}

/** Barre de progression (couleur terracotta en cours, verte à 100 %). */
export function ProgressBar({
  value,
  label,
  tone = "light",
  className = "",
}: {
  value: number;
  label: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const track = tone === "dark" ? "bg-white/15" : "bg-[#EFE7DA]";
  const fill = value >= 100 ? "fill-success" : tone === "dark" ? "fill-gold" : "fill-terracotta";
  const width = Math.min(100, Math.max(0, value));
  // SVG plutôt qu'un attribut style : compatible avec la CSP stricte (pas de style inline).
  return (
    <div
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-2 flex-1 overflow-hidden rounded-sm ${track} ${className}`}
    >
      <svg className="block size-full" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
        <rect width={width} height="8" className={`transition-[width] duration-400 ${fill}`} />
      </svg>
    </div>
  );
}

/** Note sur 5 en étoiles (texte alternatif complet, les étoiles sont décoratives). */
export function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-[13px] text-gold">
      <span className="sr-only">Note : {rating} sur 5</span>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} icon={i < rating ? faStar : faStarRegular} />
      ))}
    </span>
  );
}

export type Tone = Course["tone"];

const TONES: Record<Tone, string> = {
  forest: "bg-forest text-gold",
  terracotta: "bg-terracotta text-white",
  gold: "bg-gold text-forest",
  sand: "bg-sand text-forest",
  "forest-sand": "bg-forest text-sand",
  "sand-terracotta": "bg-sand text-terracotta-700",
};

/** Couleurs de vignette d'un cours. */
export function courseTone(tone: Tone): string {
  return TONES[tone];
}

const TONE_ORDER: Tone[] = ["forest", "terracotta", "gold", "sand", "forest-sand", "sand-terracotta"];

/** Couleur de vignette stable pour un cours sans image de couverture (dérivée de son slug). */
export function toneFor(seed: string): Tone {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONE_ORDER[hash % TONE_ORDER.length];
}

/** Photos du site (public/images, réencodées en WebP sans métadonnées). Crédits : docs/credits-photos.md et /credits. */
export const PHOTOS = {
  accueilApprenant: { src: "/images/accueil-apprenant.webp", width: 1024, height: 683, alt: "Un jeune homme sourit devant son ordinateur portable pendant un atelier numérique." },
  accueilCode: { src: "/images/accueil-code.webp", width: 960, height: 640, alt: "Écran d'ordinateur portable affichant du code dans un éditeur." },
  connexion: { src: "/images/connexion.webp", width: 960, height: 641, alt: "Deux personnes étudient ensemble du code sur un ordinateur portable." },
  inscription: { src: "/images/inscription.webp", width: 766, height: 1024, alt: "Des étudiants travaillent avec un ordinateur portable et leurs documents de cours." },
} as const;

export type Photo = (typeof PHOTOS)[keyof typeof PHOTOS];

/**
 * Photo recadrée qui remplit son conteneur (object-cover).
 * Balise <img> plutôt que next/image : next/image ajoute un attribut style en ligne, bloqué par notre CSP stricte
 * (style-src sans 'unsafe-inline'). Les fichiers sont déjà optimisés (WebP, ≤ 80 Ko).
 */
export function PhotoImage({ photo, priority = false, className = "" }: { photo: Photo; priority?: boolean; className?: string }) {
  return (
    <img
      src={photo.src}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`absolute inset-0 size-full object-cover ${className}`}
    />
  );
}

/** Emplacement photo neutre, pour les visuels pas encore fournis (ex. capture d'écran d'une leçon de démonstration). */
export function PhotoPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`grid size-full place-items-center bg-sand text-[#D9CFBF] ${className}`}>
      <Icon icon={faImage} className="text-5xl" />
    </div>
  );
}

/** Lien texte terracotta « Tout voir → ». */
export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-bold whitespace-nowrap text-terracotta-700 hover:text-forest">
      {children}
    </Link>
  );
}
