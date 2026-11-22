import { faClock, faCreditCard, faEye } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft, faAward, faCheck, faLock, faMobileScreenButton, faSignal } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PaymentDialog } from "@/components/course/payment-dialog";
import { CATEGORY_ICON_DEFS, Icon, LESSON_TYPE_ICONS } from "@/components/icon";
import { buttonStyles } from "@/components/ui";
import { getPublishedCourse } from "@/server/catalog/catalog.service";
import { formatDuration, formatPrice, plural } from "@/shared/format";

async function CourseDetail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const course = await getPublishedCourse(slug);
  // Brouillon, archivé ou inexistant : 404, sans révéler l'existence du cours.
  if (!course) notFound();

  const lessonCount = course.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <main>
      <section className="bg-forest text-sand">
        <div className="mx-auto flex max-w-site flex-wrap items-center gap-8 px-5 py-[clamp(28px,5vw,56px)]">
          <div className="min-w-0 flex-[1_1_420px]">
            <Link href="/courses" className="mb-[18px] flex items-center gap-2 text-sm font-semibold text-[#C9D8D4] hover:text-white">
              <Icon icon={faArrowLeft} />
              Catalogue{course.categoryName ? ` · ${course.categoryName}` : ""}
            </Link>
            <h1 className="mb-3.5 text-[clamp(28px,4.5vw,46px)] leading-[1.1] tracking-[-.03em] text-balance text-white">{course.title}</h1>
            {course.subtitle ? <p className="mb-[22px] max-w-[620px] text-[17px] leading-relaxed text-[#C9D8D4]">{course.subtitle}</p> : null}
            <ul className="flex flex-wrap gap-x-[22px] gap-y-2.5 text-sm text-mint-50">
              <li>
                <Icon icon={faSignal} className="text-gold" /> {course.levelLabel}
              </li>
              <li>
                <Icon icon={faClock} className="text-gold" /> {course.durationSeconds > 0 ? `${formatDuration(course.durationSeconds)} · ` : ""}
                {plural(lessonCount, "leçon")}
              </li>
              <li>
                <Icon icon={faAward} className="text-gold" /> Certificat inclus
              </li>
            </ul>
          </div>
          <div className="min-w-0 flex-[1_1_340px]">
            {/* Vidéo de présentation (F-13) : avec la gestion des médias. En attendant, la vignette du cours. */}
            <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl border border-sand/20 bg-forest-900">
              <Icon icon={CATEGORY_ICON_DEFS[course.icon]} className="text-[72px] text-gold opacity-30" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-site flex-wrap-reverse items-end gap-8 px-5 pt-8 pb-[72px]">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-8">
          {course.description || course.objectives.length || course.prerequisites.length ? (
            <section className="rounded-2xl border border-line bg-white p-[clamp(20px,3vw,28px)]" aria-labelledby="titre-objectifs">
              {course.description ? (
                <div className="mb-6 flex max-w-read flex-col gap-3 text-base leading-relaxed text-ink-700">
                  {course.description.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : null}
              {course.objectives.length ? (
                <>
                  <h2 id="titre-objectifs" className="mb-4 text-[22px] tracking-normal">
                    Ce que vous allez apprendre
                  </h2>
                  <ul className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-6 gap-y-3 text-[15px] leading-normal text-ink-700">
                    {course.objectives.map((o) => (
                      <li key={o} className="flex gap-2.5">
                        <Icon icon={faCheck} className="mt-1 text-success" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {course.prerequisites.length ? (
                <>
                  <h3 className="mt-6 mb-2.5 text-base tracking-normal text-ink">Prérequis</h3>
                  <ul className="list-disc pl-5 text-[15px] leading-[1.8] text-ink-700">
                    {course.prerequisites.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          ) : null}

          <section aria-labelledby="titre-programme">
            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
              <h2 id="titre-programme" className="text-[22px] tracking-normal">
                Programme du cours
              </h2>
              <span className="text-sm text-muted">
                {plural(course.sections.length, "section")} · {plural(lessonCount, "leçon")}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {course.sections.map((section, i) => (
                <div key={section.id} className="overflow-hidden rounded-[18px] border border-line bg-white">
                  <div className="flex items-center justify-between border-b border-[#EFE7DA] bg-paper px-[18px] py-4">
                    <h3 className="text-[15px] font-bold tracking-normal text-ink">
                      {i + 1}. {section.title}
                    </h3>
                    <span className="text-[13px] text-muted">{plural(section.lessons.length, "leçon")}</span>
                  </div>
                  <ul>
                    {section.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center gap-3.5 border-t border-inline-code px-[18px] py-3.5 first:border-t-0">
                        <Icon icon={LESSON_TYPE_ICONS[lesson.type]} className="w-[18px] text-forest" />
                        <span className="min-w-0 flex-1 text-[15px] text-ink">{lesson.title}</span>
                        {lesson.isFreePreview ? <span className="text-[13px] font-bold text-terracotta-700">Aperçu</span> : null}
                        {lesson.durationSeconds > 0 ? <span className="text-[13px] whitespace-nowrap text-muted">{formatDuration(lesson.durationSeconds)}</span> : null}
                        <Icon
                          icon={lesson.isFreePreview ? faEye : faLock}
                          label={lesson.isFreePreview ? "Aperçu gratuit" : "Réservé aux inscrits"}
                          className={`text-[13px] ${lesson.isFreePreview ? "text-terracotta-700" : "text-[#9AA6A3]"}`}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside
          aria-label="Inscription au cours"
          className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-2xl border border-line bg-white p-[22px] shadow-lift lg:sticky lg:top-[88px]"
        >
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-[30px] font-extrabold tracking-tight whitespace-nowrap text-forest">{formatPrice(course.price)}</span>
            {course.compareAtPrice ? (
              <s className="text-[15px] whitespace-nowrap text-subtle">
                <span className="sr-only">Prix initial : </span>
                {formatPrice(course.compareAtPrice)}
              </s>
            ) : null}
          </div>
          {course.price === 0 ? (
            <button type="button" disabled className={buttonStyles.block}>
              Inscription bientôt disponible
            </button>
          ) : (
            <PaymentDialog course={{ slug: course.slug, title: course.title, price: course.price, icon: course.icon }} />
          )}
          <p className="flex items-center justify-center gap-2.5 text-[13px] text-muted">
            <Icon icon={faMobileScreenButton} />
            Orange Money · MTN MoMo
            <Icon icon={faCreditCard} className="ml-1.5" />
            Carte
          </p>
        </aside>
      </div>
    </main>
  );
}

export default function CoursePage(props: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-site px-5 py-12 text-muted">Chargement du cours…</main>}>
      <CourseDetail params={props.params} />
    </Suspense>
  );
}
