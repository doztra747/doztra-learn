import { faClock, faFileLines } from "@fortawesome/free-regular-svg-icons";
import Link from "next/link";

import { FavoriteButton } from "@/components/course/favorite-button";
import { CATEGORY_ICON_DEFS, Icon } from "@/components/icon";
import { courseTone, toneFor } from "@/components/ui";
import type { CourseSummary } from "@/server/catalog/catalog.service";
import { formatDuration, formatPrice } from "@/shared/format";

/** Carte de cours (accueil, catalogue). Toute la carte est cliquable via le lien du titre. */
export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-line bg-white p-2.5 transition duration-200 hover:-translate-y-[3px] hover:shadow-card focus-within:shadow-card">
      <div className={`relative grid h-[150px] place-items-center overflow-hidden rounded-[15px] ${courseTone(toneFor(course.slug))}`}>
        <Icon icon={CATEGORY_ICON_DEFS[course.icon]} className="text-[46px]" />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-forest">{course.levelLabel}</span>
        <FavoriteButton courseTitle={course.title} className="absolute top-2 right-2 z-10" />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pb-1.5">
        {course.categoryName ? <span className="text-xs font-bold tracking-[.06em] text-terracotta-700 uppercase">{course.categoryName}</span> : null}
        <h3 className="text-base leading-[1.35] font-bold tracking-normal text-pretty text-ink">
          <Link
            href={`/courses/${course.slug}`}
            className="text-ink after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-ink"
          >
            {course.title}
          </Link>
        </h3>
        <div className="flex gap-3.5 text-[13px] text-muted">
          <span className="flex items-center gap-1">
            <Icon icon={faFileLines} /> {course.lessonCount} {course.lessonCount > 1 ? "leçons" : "leçon"}
          </span>
          {course.durationSeconds > 0 ? (
            <span className="flex items-center gap-1">
              <Icon icon={faClock} /> {formatDuration(course.durationSeconds)}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-end border-t border-dashed border-line-strong pt-3">
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            {course.compareAtPrice ? (
              <s className="text-xs text-subtle">
                <span className="sr-only">Prix initial : </span>
                {formatPrice(course.compareAtPrice)}
              </s>
            ) : null}
            <span className="text-[15px] font-extrabold text-forest">{formatPrice(course.price)}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
