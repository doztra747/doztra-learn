import { faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "@/components/icon";
import type { ReadinessItem } from "@/server/courses/courses.service";

/** Encadré « Prêt à publier ? » (RG-10) : chaque condition avec son état (icône + texte, pas la couleur seule). */
export function PublishChecklist({ items }: { items: ReadinessItem[] }) {
  const ready = items.every((i) => i.ok);
  return (
    <aside aria-labelledby="titre-publier" className="flex min-w-0 flex-col gap-3 rounded-xl border border-line-admin bg-white p-[18px] lg:sticky lg:top-[90px]">
      <h3 id="titre-publier" className="text-[15px] font-bold tracking-normal text-ink">
        Prêt à publier ?
      </h3>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5 text-sm text-[#2B3B38]">
            <Icon icon={item.ok ? faCircleCheck : faTriangleExclamation} className={item.ok ? "text-success" : "text-terracotta-700"} />
            <span>
              {item.label}
              {item.detail ? <span className="text-muted"> ({item.detail})</span> : null}
              <span className="sr-only">{item.ok ? " : fait" : " : à compléter"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={`rounded-base p-3 text-[13px] leading-normal ${ready ? "bg-success-bg text-success-dark" : "bg-danger-bg text-[#5A2A20]"}`}>
        {ready
          ? "Toutes les conditions sont remplies : vous pouvez publier depuis l'onglet Publication."
          : "Une leçon devient publiable quand son contenu est prêt (texte rédigé, vidéo transcodée avec miniature, PDF traité ou quiz complet)."}
      </p>
    </aside>
  );
}
