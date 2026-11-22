import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Icon, SUBJECT_ICONS } from "@/components/icon";
import { MySpace } from "@/components/learn/my-space";
import { courseTone, ProgressBar } from "@/components/ui";
import { DEMO_ENROLLMENTS, getCourse } from "@/server/demo/data";

export const metadata: Metadata = { title: "Mes cours" };

async function EnrollmentList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const status = (await searchParams).tab === "done" ? "done" : "progress";
  const enrollments = DEMO_ENROLLMENTS.filter((e) => e.status === status);

  return (
    <MySpace tab={status}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {enrollments.map((enrollment) => {
          const course = getCourse(enrollment.courseSlug);
          if (!course) return null;
          const finished = enrollment.progress === 100;
          return (
            <article key={course.slug} className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-3.5">
                <span className={`grid size-14 shrink-0 place-items-center rounded-lg text-[22px] ${courseTone(course.tone)}`}>
                  <Icon icon={SUBJECT_ICONS[course.icon]} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] leading-[1.35] font-bold tracking-normal text-ink">{course.title}</h2>
                  <p className="mt-[3px] text-[13px] text-muted">{enrollment.lastLesson}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <ProgressBar value={enrollment.progress} label={`Progression : ${enrollment.progress} %`} />
                <span className="text-[13px] font-bold">{enrollment.progress} %</span>
              </div>
              <Link
                href={`/learn/${course.slug}/l1`}
                className="rounded-base border border-line-strong bg-white p-3 text-center text-sm font-bold text-forest hover:border-forest"
              >
                {finished ? "Revoir" : "Reprendre"}
                <span className="sr-only"> : {course.title}</span>
              </Link>
            </article>
          );
        })}
      </div>
    </MySpace>
  );
}

/** F-64 : Mes cours (en cours, terminés). Phase 6 : requireUser() + inscriptions réelles. */
export default function MyCoursesPage(props: PageProps<"/my-courses">) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-site px-5 py-12 text-muted">Chargement de vos cours…</main>}>
      <EnrollmentList searchParams={props.searchParams} />
    </Suspense>
  );
}
