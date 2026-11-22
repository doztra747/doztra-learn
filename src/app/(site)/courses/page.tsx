import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { CourseCard } from "@/components/course/course-card";
import { SortSelect } from "@/components/course/sort-select";
import { Icon } from "@/components/icon";
import { buttonStyles } from "@/components/ui";
import type { CourseLevel } from "@/generated/prisma/client";
import { type CatalogFilters, getPublicCategories, searchPublishedCourses } from "@/server/catalog/catalog.service";
import { COURSE_LEVELS, LEVEL_LABELS } from "@/shared/courses";
import { plural } from "@/shared/format";

export const metadata: Metadata = { title: "Catalogue des cours" };

type Search = Record<string, string | string[] | undefined>;

/** Filtres lus dans l'URL : chaque valeur est validée par liste blanche. */
type UrlFilters = { q?: string; category?: string; level?: CourseLevel; price?: "free" | "paid"; sort?: "new" | "price" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function readFilters(sp: Search, categorySlugs: string[]): UrlFilters {
  const price = first(sp.price);
  const level = first(sp.level);
  const category = first(sp.category);
  const sort = first(sp.sort);
  return {
    q: first(sp.q)?.trim().slice(0, 100) || undefined,
    category: category && categorySlugs.includes(category) ? category : undefined,
    level: (COURSE_LEVELS as readonly string[]).includes(level ?? "") ? (level as CourseLevel) : undefined,
    price: price === "free" || price === "paid" ? price : undefined,
    sort: sort === "price" ? "price" : undefined,
  };
}

/** URL du catalogue avec un filtre modifié (les autres sont conservés). */
function withFilter(filters: UrlFilters, key: keyof UrlFilters, value?: string) {
  const params = new URLSearchParams();
  const next = { ...filters, [key]: value };
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/courses?${qs}` : "/courses";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`shrink-0 rounded-full border px-[15px] py-[9px] text-sm font-semibold whitespace-nowrap ${
        active ? "border-forest bg-forest text-white hover:text-white" : "border-line-strong bg-white text-ink hover:border-forest hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5" role="group" aria-label={label}>
      <span className="w-[78px] shrink-0 text-[13px] font-bold text-muted">{label}</span>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-0.5">{children}</div>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  await connection();
  const categories = await getPublicCategories();
  const filters = readFilters(await searchParams, categories.map((c) => c.slug));
  const results = await searchPublishedCourses(filters satisfies CatalogFilters);

  return (
    <>
      <form action="/courses" role="search" className="flex max-w-[640px] items-center gap-2.5 rounded-lg border border-line-strong bg-white px-4 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-gold">
        <Icon icon={faMagnifyingGlass} className="text-subtle" />
        {/* Les filtres actifs sont conservés lors d'une nouvelle recherche. */}
        {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
        {filters.level ? <input type="hidden" name="level" value={filters.level} /> : null}
        {filters.price ? <input type="hidden" name="price" value={filters.price} /> : null}
        <input
          name="q"
          type="search"
          defaultValue={filters.q}
          maxLength={100}
          placeholder="Rechercher un cours, une techno…"
          aria-label="Rechercher"
          className="min-w-0 flex-1 bg-transparent py-[15px] text-base outline-none focus-visible:outline-none"
        />
        {filters.q ? (
          <Link href={withFilter(filters, "q")} aria-label="Effacer la recherche" className="text-base text-muted">
            <Icon icon={faXmark} />
          </Link>
        ) : null}
      </form>

      <div className="mt-[22px] mb-7 flex flex-col gap-3">
        {categories.length > 0 ? (
          <FilterRow label="Catégorie">
            <Chip href={withFilter(filters, "category")} active={!filters.category}>
              Tous
            </Chip>
            {categories.map((c) => (
              <Chip key={c.slug} href={withFilter(filters, "category", c.slug)} active={filters.category === c.slug}>
                {c.name}
              </Chip>
            ))}
          </FilterRow>
        ) : null}
        <FilterRow label="Niveau">
          <Chip href={withFilter(filters, "level")} active={!filters.level}>
            Tous
          </Chip>
          {COURSE_LEVELS.map((level) => (
            <Chip key={level} href={withFilter(filters, "level", level)} active={filters.level === level}>
              {LEVEL_LABELS[level]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Prix">
          <Chip href={withFilter(filters, "price")} active={!filters.price}>
            Tous
          </Chip>
          <Chip href={withFilter(filters, "price", "free")} active={filters.price === "free"}>
            Gratuit
          </Chip>
          <Chip href={withFilter(filters, "price", "paid")} active={filters.price === "paid"}>
            Payant
          </Chip>
        </FilterRow>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold text-ink" role="status">
          {plural(results.length, "cours", "cours")}
        </p>
        <SortSelect value={filters.sort ?? "new"} />
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D9CFBF] bg-white px-5 py-12 text-center">
          <Icon icon={faMagnifyingGlass} className="text-[28px] text-[#B5BFBC]" />
          <h2 className="mt-3.5 mb-1.5 text-lg tracking-normal">
            {filters.q || filters.category || filters.level || filters.price ? "Aucun cours ne correspond" : "Aucun cours publié pour l'instant"}
          </h2>
          <p className="mb-[18px] text-muted">
            {filters.q || filters.category || filters.level || filters.price ? "Essayez un autre mot-clé ou retirez un filtre." : "Les premiers cours arrivent bientôt."}
          </p>
          {filters.q || filters.category || filters.level || filters.price ? (
            <Link href="/courses" className={buttonStyles.primary}>
              Réinitialiser les filtres
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[18px]">
          {results.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </>
  );
}

export default function CatalogPage(props: PageProps<"/courses">) {
  return (
    <main className="mx-auto w-full max-w-site px-5 pt-[clamp(24px,4vw,48px)] pb-[72px]">
      <h1 className="mb-1.5 text-[clamp(28px,4vw,40px)] tracking-[-.03em]">Catalogue des cours</h1>
      <p className="mb-6 text-base text-muted">Filtrez par catégorie, niveau ou prix. La recherche tolère les accents.</p>
      <Suspense fallback={<p className="text-muted">Chargement du catalogue…</p>}>
        <Catalog searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
