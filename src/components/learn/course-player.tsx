"use client";

import { faCircle, faCircleCheck as faCircleCheckRegular } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft, faArrowRight, faCircleCheck, faCircleDot, faExpand, faList } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon, LESSON_ICONS } from "@/components/icon";
import { useProgress } from "@/components/learn/progress-context";
import { buttonStyles, ProgressBar } from "@/components/ui";
import type { Lesson, Section } from "@/server/demo/data";

type Props = {
  courseSlug: string;
  courseTitle: string;
  program: Section[];
  currentId: string;
  previousId?: string;
  nextId?: string;
  /** Lecteur vidéo ou visionneuse PDF, au-dessus de la carte de la leçon. */
  media?: React.ReactNode;
  /** Contenu de la carte de la leçon (rendu côté serveur). */
  children: React.ReactNode;
  /** Questions et réponses, sous la carte. */
  discussion?: React.ReactNode;
};

/** Cadre du lecteur de cours (prototype « player ») : en-tête de progression, programme, navigation. */
export function CoursePlayer({ courseSlug, courseTitle, program, currentId, previousId, nextId, media, children, discussion }: Props) {
  const { done, markDone } = useProgress();
  const router = useRouter();
  const [focus, setFocus] = useState(false);

  const lessons = program.flatMap((s) => s.lessons);
  const doneCount = lessons.filter((l) => done.has(l.id)).length;
  const percent = Math.round((doneCount / lessons.length) * 100);
  const isDone = done.has(currentId);
  const href = (id: string) => `/learn/${courseSlug}/${id}`;

  return (
    <main className="mx-auto w-full max-w-[1320px] px-5 pt-5 pb-16">
      <div className="mb-[18px] flex flex-wrap items-center gap-3">
        <Link href="/my-courses" aria-label="Retour à mes cours" className={buttonStyles.square}>
          <Icon icon={faArrowLeft} />
        </Link>
        <div className="min-w-0 flex-[1_1_240px]">
          <p className="text-[13px] font-semibold text-muted">{courseTitle}</p>
          <div className="mt-1.5 flex items-center gap-2.5">
            <ProgressBar value={percent} label={`Progression du cours : ${percent} %`} className="max-w-[280px]" />
            <span className="text-[13px] font-bold text-ink">
              {percent} % · {doneCount}/{lessons.length}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFocus((v) => !v)}
          aria-pressed={focus}
          aria-controls="programme"
          className="flex items-center gap-2 rounded-base border border-line bg-white px-3.5 py-[11px] text-sm font-semibold text-forest"
        >
          <Icon icon={focus ? faList : faExpand} />
          {focus ? "Afficher le programme" : "Mode concentration"}
        </button>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <article className="flex min-w-0 flex-[3_1_560px] flex-col gap-5">
          {media}
          <div className="rounded-2xl border border-line bg-white p-[clamp(20px,4vw,40px)]">
          {children}
          <nav aria-label="Navigation entre les leçons" className="mt-8 flex flex-wrap gap-2.5 border-t border-[#EFE7DA] pt-6">
            {previousId ? (
              <Link href={href(previousId)} className="flex flex-1 items-center justify-center gap-2 rounded-base sm:flex-none border border-line-strong bg-white px-4 py-[13px] text-sm font-semibold text-forest">
                <Icon icon={faArrowLeft} />
                Précédente
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (isDone) return;
                markDone(currentId);
                if (nextId) router.push(href(nextId));
              }}
              className={`order-first flex w-full items-center justify-center gap-2 rounded-base px-[18px] py-[13px] text-sm font-bold sm:order-none sm:ml-auto sm:w-auto ${
                isDone ? "bg-success-bg text-success" : "bg-forest text-white"
              }`}
            >
              <Icon icon={isDone ? faCircleCheck : faCircleCheckRegular} />
              {isDone ? "Leçon terminée" : "Marquer comme terminée"}
            </button>
            {nextId ? (
              <Link href={href(nextId)} className="flex flex-1 items-center justify-center gap-2 rounded-base sm:flex-none border border-line-strong bg-white px-4 py-[13px] text-sm font-semibold text-forest">
                Suivante
                <Icon icon={faArrowRight} />
              </Link>
            ) : null}
          </nav>
          </div>
          {discussion}
        </article>

        <aside
          id="programme"
          aria-label="Programme du cours"
          hidden={focus}
          className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 lg:sticky lg:top-[88px]"
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <h2 className="border-b border-[#EFE7DA] px-[18px] py-4 text-base tracking-normal">Programme</h2>
            {program.map((section, i) => (
              <div key={section.title} className="px-2.5 pt-2.5 pb-1.5">
                <div className="flex justify-between gap-2 px-2 pt-1.5 pb-2">
                  <h3 className="text-sm font-bold tracking-normal text-ink">{section.title}</h3>
                  <span className="text-xs text-muted">
                    Section {i + 1} · {section.lessons.filter((l) => done.has(l.id)).length}/{section.lessons.length}
                  </span>
                </div>
                <ul>
                  {section.lessons.map((lesson) => (
                    <LessonLink key={lesson.id} lesson={lesson} href={href(lesson.id)} current={lesson.id === currentId} done={done.has(lesson.id)} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

function LessonLink({ lesson, href, current, done }: { lesson: Lesson; href: string; current: boolean; done: boolean }) {
  const status = done ? "Terminée" : current ? "En cours" : "À faire";
  return (
    <li>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={`flex w-full items-center gap-3 rounded-base px-2.5 py-[11px] text-left ${current ? "bg-mint" : "hover:bg-paper"}`}
      >
        <Icon
          icon={done ? faCircleCheck : current ? faCircleDot : faCircle}
          label={status}
          className={`text-base ${done ? "text-success" : current ? "text-terracotta" : "text-[#B5BFBC]"}`}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`text-sm leading-[1.35] ${current ? "font-bold text-forest" : "font-medium text-ink"}`}>{lesson.title}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Icon icon={LESSON_ICONS[lesson.type]} />
            {lesson.duration}
          </span>
        </span>
      </Link>
    </li>
  );
}
