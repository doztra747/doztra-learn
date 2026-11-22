import { faClock, faComments, faFilePdf } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck, faDownload } from "@fortawesome/free-solid-svg-icons";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Icon, LESSON_ICONS, LESSON_TYPE_LABELS } from "@/components/icon";
import { Callout } from "@/components/learn/callout";
import { CodeBlock } from "@/components/learn/code-block";
import { CoursePlayer } from "@/components/learn/course-player";
import { PdfViewerMock, VideoPlayerMock } from "@/components/learn/lesson-media";
import { QuizDemo } from "@/components/learn/quiz-demo";
import { PhotoPlaceholder } from "@/components/ui";
import { DEMO_CODE, DEMO_QUIZ, findLesson, getCourse, PROGRAM } from "@/server/demo/data";

const inlineCode = "rounded-[6px] bg-inline-code px-1.5 py-0.5 font-mono text-[15px]";

/** Leçon textuelle de démonstration (prototype). Phase 4 : content_html nettoyé, rendu côté serveur. */
function TextLessonDemo() {
  return (
    <div className="flex max-w-read flex-col gap-[18px] text-[17px] leading-[1.75] text-[#2B3B38]">
      <p className="text-pretty">
        En JavaScript, on stocke une valeur dans une <strong>variable</strong>. Depuis ES2015, deux mots-clés suffisent :{" "}
        <code className={inlineCode}>const</code> pour une valeur qui ne sera pas réassignée, et <code className={inlineCode}>let</code> pour une valeur qui
        changera.
      </p>
      <Callout variant="tip">
        Utilisez <strong>const</strong> par défaut, et passez à <strong>let</strong> seulement si vous devez réassigner la variable.
      </Callout>
      <h2 className="mt-2 text-[22px] tracking-normal">Déclarer et réassigner</h2>
      <CodeBlock lines={DEMO_CODE.lines} filename={DEMO_CODE.filename} language={DEMO_CODE.language} highlightLines={[DEMO_CODE.highlightLine]} />
      <Callout variant="warning">
        La ligne 8 provoque une <strong>TypeError</strong> : une constante ne peut pas être réassignée.
      </Callout>
      <figure className="flex flex-col gap-2">
        <div className="relative aspect-video overflow-hidden rounded-md bg-sand">
          <PhotoPlaceholder />
        </div>
        <figcaption className="text-center text-sm text-muted">Résultat affiché dans la console de Chrome.</figcaption>
      </figure>
    </div>
  );
}

function Discussion() {
  return (
    <section aria-labelledby="titre-questions" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-[clamp(20px,3vw,28px)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titre-questions" className="flex items-center gap-2.5 text-xl tracking-normal">
          <Icon icon={faComments} />
          Questions et réponses
        </h2>
        <button type="button" disabled title="Disponible à la phase 7" className="rounded-base border border-line-strong bg-white px-3.5 py-2.5 text-sm font-bold text-forest disabled:cursor-not-allowed disabled:opacity-60">
          Poser une question
        </button>
      </div>
      <div className="flex gap-3">
        <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-danger-bg text-[13px] font-extrabold text-terracotta-700" aria-hidden="true">
          MS
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <strong>Moussa S.</strong> <span className="text-subtle">· il y a 2 jours</span>
          </p>
          <p className="mt-1 mb-2.5 text-[15px] leading-relaxed text-[#2B3B38]">
            Pourquoi un tableau déclaré avec const peut-il quand même recevoir des éléments avec push ?
          </p>
          <div className="rounded-md bg-mint px-4 py-3.5">
            <p className="mb-1 flex items-center gap-2 text-[13px] font-bold text-forest">
              <Icon icon={faCircleCheck} />
              Réponse du formateur
            </p>
            <p className="text-[15px] leading-relaxed text-[#1F3533]">
              const empêche de réassigner la variable, pas de modifier le contenu du tableau. La référence reste la même.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

async function Lesson({ params }: { params: Promise<{ courseSlug: string; lessonId: string }> }) {
  const { courseSlug, lessonId } = await params;
  const course = getCourse(courseSlug);
  const found = findLesson(lessonId);
  // Phase 6 : assertCanAccessLesson(user, lesson) ici (inscription active ou aperçu gratuit, RG-30).
  if (!course || !found) notFound();
  const { lesson, previous, next } = found;

  const media =
    lesson.type === "video" ? <VideoPlayerMock /> : lesson.type === "pdf" ? <PdfViewerMock filename="memo-es2024.pdf" allowDownload /> : null;

  return (
    <CoursePlayer
      courseSlug={course.slug}
      courseTitle={course.title}
      program={PROGRAM}
      currentId={lesson.id}
      previousId={previous?.id}
      nextId={next?.id}
      media={media}
      discussion={<Discussion />}
    >
      <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-terracotta-700">
        <Icon icon={LESSON_ICONS[lesson.type]} />
        {LESSON_TYPE_LABELS[lesson.type]} · {lesson.section}
      </p>
      <h1 className="mb-2 text-[clamp(24px,3.5vw,34px)] leading-[1.15] tracking-[-.025em]">{lesson.title}</h1>
      <p className="mb-6 text-sm text-muted">
        <Icon icon={faClock} /> {lesson.duration}
      </p>

      {lesson.type === "text" ? <TextLessonDemo /> : null}

      {lesson.type === "video" ? (
        <>
          <p className="max-w-read text-base leading-[1.7] text-ink-700">
            Dans cette vidéo, nous voyons comment déclarer une fonction, la différence entre fonction classique et fonction fléchée, et comment la
            portée détermine quelles variables sont accessibles.
          </p>
          <ul className="mt-[18px] flex flex-wrap gap-2.5" aria-label="Ressources de la leçon">
            <li className="flex items-center gap-2.5 rounded-base border border-line-strong px-3.5 py-3 text-sm font-semibold text-forest">
              <Icon icon={faDownload} />
              fonctions-exemples.zip · 12 Ko
            </li>
            <li className="flex items-center gap-2.5 rounded-base border border-line-strong px-3.5 py-3 text-sm font-semibold text-forest">
              <Icon icon={faFilePdf} />
              slides-fonctions.pdf
            </li>
          </ul>
        </>
      ) : null}

      {lesson.type === "pdf" ? (
        <p className="max-w-read text-base leading-[1.7] text-ink-700">
          Gardez cette fiche à portée de main pendant les exercices. Le téléchargement est autorisé pour ce document.
        </p>
      ) : null}

      {lesson.type === "quiz" ? (
        <QuizDemo
          key={lesson.id}
          lessonId={lesson.id}
          question={DEMO_QUIZ.question}
          code={<CodeBlock lines={DEMO_QUIZ.code} showLineNumbers={false} />}
          options={DEMO_QUIZ.options}
          answer={DEMO_QUIZ.answer}
          explanationRight={DEMO_QUIZ.explanationRight}
          explanationWrong={DEMO_QUIZ.explanationWrong}
        />
      ) : null}
    </CoursePlayer>
  );
}

/** Lecteur de cours (F-61, F-62). */
export default function LessonPage(props: PageProps<"/learn/[courseSlug]/[lessonId]">) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-[1320px] px-5 py-12 text-muted">Chargement de la leçon…</main>}>
      <Lesson params={props.params} />
    </Suspense>
  );
}
