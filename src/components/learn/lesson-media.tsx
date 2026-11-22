import { faClosedCaptioning, faFilePdf } from "@fortawesome/free-regular-svg-icons";
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
  faExpand,
  faMagnifyingGlass,
  faMagnifyingGlassPlus,
  faPlay,
  faRotateLeft,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";

import { Icon } from "@/components/icon";
import { ProgressBar } from "@/components/ui";

/**
 * Lecteur vidéo simulé (prototype). Phase 5 : Video.js + hls.js chargé par next/dynamic,
 * URL HLS signée émise après contrôle d'inscription (RG-30), position envoyée toutes les 15 s (RG-31).
 */
export function VideoPlayerMock() {
  return (
    <div className="overflow-hidden rounded-2xl bg-forest-900" role="region" aria-label="Lecteur vidéo (démonstration)">
      <div className="relative grid aspect-video place-items-center">
        <button type="button" aria-label="Lire la vidéo" className="grid size-[76px] place-items-center rounded-full bg-gold text-[26px] text-forest">
          <Icon icon={faPlay} className="ml-1" />
        </button>
        <span className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-[7px] text-[13px] font-semibold text-sand">
          <Icon icon={faRotateLeft} /> Reprendre à 03:12
        </span>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3 pb-3.5 text-mint-50">
        <ProgressBar value={23} label="Position de lecture : 03:12 sur 14:30" tone="dark" className="h-1.5 [&_rect]:fill-terracotta" />
        <div className="flex items-center gap-4 text-sm">
          <Icon icon={faPlay} />
          <Icon icon={faVolumeHigh} />
          <span className="font-mono text-[13px]">03:12 / 14:30</span>
          <span className="ml-auto flex items-center gap-3.5">
            <span className="font-bold">1×</span>
            <span className="font-bold">720p</span>
            <Icon icon={faClosedCaptioning} label="Sous-titres" />
            <Icon icon={faExpand} label="Plein écran" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visionneuse PDF simulée (prototype). Phase 5 : PDF.js chargé par next/dynamic, fichier servi par URL signée 5 min,
 * bouton Télécharger seulement si allow_download (F-53).
 */
export function PdfViewerMock({ filename, allowDownload }: { filename: string; allowDownload: boolean }) {
  const toolButton = "grid size-[34px] place-items-center rounded-sm border border-line-strong bg-white";
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-[#E9E2D6]" role="region" aria-label={`Document PDF : ${filename} (démonstration)`}>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink">
        <Icon icon={faFilePdf} className="text-terracotta-700" />
        <strong className="min-w-[120px] flex-1">{filename}</strong>
        <span className="flex items-center gap-1.5">
          <button type="button" aria-label="Page précédente" className={toolButton}>
            <Icon icon={faChevronLeft} />
          </button>
          3 / 12
          <button type="button" aria-label="Page suivante" className={toolButton}>
            <Icon icon={faChevronRight} />
          </button>
        </span>
        <span className="flex gap-1.5">
          <button type="button" aria-label="Rechercher dans le document" className={toolButton}>
            <Icon icon={faMagnifyingGlass} />
          </button>
          <button type="button" aria-label="Agrandir" className={toolButton}>
            <Icon icon={faMagnifyingGlassPlus} />
          </button>
          {allowDownload ? (
            <button type="button" aria-label="Télécharger le PDF" className="grid size-[34px] place-items-center rounded-sm bg-forest text-white">
              <Icon icon={faDownload} />
            </button>
          ) : null}
        </span>
      </div>
      <div className="p-[clamp(14px,3vw,32px)]">
        <div className="mx-auto flex aspect-[1/1.3] max-w-[560px] flex-col gap-3.5 rounded-[6px] bg-white p-[clamp(18px,4vw,40px)] shadow-[0_10px_30px_-18px_rgba(0,0,0,.4)]">
          <span className="text-[11px] font-bold tracking-[.1em] text-terracotta-700">FICHE MÉMO · PAGE 3</span>
          <h2 className="text-[clamp(18px,2.4vw,24px)] tracking-normal">Déstructuration et opérateurs</h2>
          <pre className="rounded-lg bg-paper p-3 font-mono text-[clamp(11px,1.4vw,13px)] leading-[1.9] whitespace-pre-wrap text-ink">
            {"const { nom, age } = user;\nconst [a, ...reste] = liste;\nconst total = prix ?? 0;\nuser?.adresse?.ville;"}
          </pre>
          <p className="text-[clamp(12px,1.5vw,14px)] leading-[1.7] text-ink-700">
            L&apos;opérateur <strong>??</strong> ne remplace que null et undefined, contrairement à <strong>||</strong> qui remplace aussi 0 et la chaîne vide.
          </p>
        </div>
      </div>
    </div>
  );
}
