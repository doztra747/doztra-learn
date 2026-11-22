"use client";

import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import { Icon } from "@/components/icon";

/** Favori (F-15). Démonstration : état local ; à brancher sur la liste de souhaits (phase 4). */
export function FavoriteButton({ courseTitle, className = "" }: { courseTitle: string; className?: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Retirer « ${courseTitle} » des favoris` : `Ajouter « ${courseTitle} » aux favoris`}
      onClick={() => setOn((v) => !v)}
      className={`grid size-9 place-items-center rounded-full bg-white/95 text-terracotta ${className}`}
    >
      <Icon icon={on ? faHeart : faHeartRegular} />
    </button>
  );
}
