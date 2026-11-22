"use client";

import { createContext, useContext, useState } from "react";

type ProgressValue = {
  done: ReadonlySet<string>;
  markDone: (lessonId: string) => void;
};

const ProgressContext = createContext<ProgressValue | null>(null);

/**
 * Progression du lecteur, partagée entre les leçons d'un même cours (le layout persiste d'une leçon à l'autre).
 * DÉMONSTRATION : état local. Phase 6 : PUT /api/v1/lessons/[id]/progress, le serveur fait foi (RG-31, RG-32).
 */
export function ProgressProvider({ initialDone, children }: { initialDone: string[]; children: React.ReactNode }) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(initialDone));
  const markDone = (lessonId: string) => setDone((prev) => new Set(prev).add(lessonId));
  return <ProgressContext value={{ done, markDone }}>{children}</ProgressContext>;
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress doit être utilisé dans <ProgressProvider>.");
  return value;
}
