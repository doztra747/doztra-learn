"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// « Les plus populaires » et « Les mieux notés » reviendront avec les inscriptions et les avis.
const OPTIONS = [
  { value: "new", label: "Nouveautés" },
  { value: "price", label: "Prix croissant" },
];

/** Tri du catalogue : l'état vit dans l'URL (?sort=). */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Trier par
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          if (e.target.value === "new") params.delete("sort");
          else params.set("sort", e.target.value);
          const qs = params.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        className="rounded-[10px] border border-line-strong bg-white px-3 py-[9px] text-sm text-ink"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
