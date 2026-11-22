"use client";

import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck, faCircleDot, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

import { Icon } from "@/components/icon";
import { useProgress } from "@/components/learn/progress-context";

type Props = {
  lessonId: string;
  question: string;
  code: React.ReactNode;
  options: { key: string; text: string }[];
  answer: string;
  explanationRight: string;
  explanationWrong: string;
};

/**
 * Quiz du prototype. DÉMONSTRATION : la correction est faite dans le navigateur.
 * Phase 6 : soumission à POST /api/v1/attempts/[id]/submit ; la bonne réponse n'est jamais envoyée avant (RG-42).
 */
export function QuizDemo({ lessonId, question, code, options, answer, explanationRight, explanationWrong }: Props) {
  const { markDone } = useProgress();
  const [picked, setPicked] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const right = sent && picked === answer;

  return (
    <form
      className="flex max-w-read flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!picked) return;
        setSent(true);
        if (picked === answer) markDone(lessonId);
      }}
    >
      <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-muted">
        <span>Question 1 sur 5</span>
        <span>Score minimum : 70 % · 3 tentatives</span>
      </div>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 text-lg leading-normal font-bold text-ink">{question}</legend>
        {code}
        <div className="flex flex-col gap-2.5">
          {options.map((option) => {
            const isPicked = picked === option.key;
            const isAnswer = option.key === answer;
            let tone = isPicked ? "border-forest bg-[#F4F8F7]" : "border-line-strong bg-white";
            let icon = isPicked ? faCircleDot : faCircle;
            let iconColor = isPicked ? "text-forest" : "text-[#B5BFBC]";
            if (sent && isAnswer) {
              tone = "border-success bg-success-bg";
              icon = faCircleCheck;
              iconColor = "text-success";
            } else if (sent && isPicked) {
              tone = "border-terracotta bg-danger-bg";
              icon = faCircleXmark;
              iconColor = "text-terracotta-700";
            }
            return (
              <label
                key={option.key}
                className={`flex items-center gap-3.5 rounded-md border-[1.5px] px-4 py-[15px] text-base text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-gold ${tone} ${sent ? "" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option.key}
                  checked={isPicked}
                  disabled={sent}
                  onChange={() => setPicked(option.key)}
                  className="sr-only"
                />
                <Icon icon={icon} className={`text-lg ${iconColor}`} />
                <span className="font-bold text-muted">{option.key.toUpperCase()}</span>
                <span>{option.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {right ? (
          <p className="flex gap-3 rounded-md bg-success-bg p-4 text-[15px] leading-relaxed text-success-dark">
            <Icon icon={faCircleCheck} className="mt-1" />
            <span>
              <strong>Bonne réponse.</strong> {explanationRight}
            </span>
          </p>
        ) : null}
        {sent && !right ? (
          <div className="flex items-start gap-3 rounded-md bg-danger-bg p-4 text-[15px] leading-relaxed text-[#5A2A20]">
            <Icon icon={faCircleXmark} className="mt-1 text-terracotta-700" />
            <p className="flex-1">
              <strong>Pas tout à fait.</strong> {explanationWrong}
            </p>
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setSent(false);
              }}
              className="rounded-[10px] bg-white px-3 py-2 font-bold text-danger"
            >
              Réessayer
            </button>
          </div>
        ) : null}
      </div>

      {!sent ? (
        <button
          type="submit"
          disabled={!picked}
          className="self-start rounded-base bg-forest px-[22px] py-3.5 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Valider ma réponse
        </button>
      ) : null}
    </form>
  );
}
