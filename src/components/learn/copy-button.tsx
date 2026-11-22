"use client";

import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icon";

/** Bouton « Copier » d'un bloc de code : copie le texte source, pas le HTML coloré. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          // Presse-papiers indisponible (contexte non sécurisé) : le code reste sélectionnable.
        }
      }}
      className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-sand/25 bg-transparent px-3 py-1.5 text-[13px] font-semibold text-sand"
    >
      <Icon icon={copied ? faCheck : faCopy} />
      <span aria-live="polite">{copied ? "Copié" : "Copier"}</span>
    </button>
  );
}
