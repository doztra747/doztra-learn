import { ProgressProvider } from "@/components/learn/progress-context";
import { DEMO_DONE_LESSONS } from "@/server/demo/data";

/** Garde la progression de démonstration pendant la navigation entre leçons du cours. */
export default function CoursePlayerLayout({ children }: LayoutProps<"/learn/[courseSlug]">) {
  return <ProgressProvider initialDone={DEMO_DONE_LESSONS}>{children}</ProgressProvider>;
}
