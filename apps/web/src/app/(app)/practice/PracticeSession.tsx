"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import {
  buildChooseTargetExercise,
  buildSpotExercise,
  grade,
  type ContentItem,
  type Exercise,
  type Variant,
} from "@english-variant/shared";
import { DialectBadge } from "@/components/DialectBadge";
import { getBrowserSupabase } from "@/lib/supabase/client";

const SESSION_LENGTH = 6;

export function PracticeSession({
  target,
  items,
}: {
  target: Variant;
  items: ContentItem[];
}) {
  const session = useMemo(() => buildSession(target, items), [target, items]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (index >= session.length) {
    return (
      <div className="mx-auto max-w-[520px] text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
          Session complete
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-ink"
          style={{ letterSpacing: "-0.02em" }}
        >
          {correctCount} of {session.length}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Your missed items were added to Review. Come back tomorrow for a new set.
        </p>
        <div className="mt-8">
          <Button
            onPress={() => {
              setIndex(0);
              setPicked(null);
              setRevealed(false);
              setCorrectCount(0);
            }}
          >
            Run another set
          </Button>
        </div>
      </div>
    );
  }

  const ex = session[index]!;
  const options = getOptions(ex);
  const expected = getExpected(ex);

  async function onPick(value: string) {
    if (revealed) return;
    setPicked(value);
    setRevealed(true);
    const result = grade(expected, value);
    if (result.correct) setCorrectCount((c) => c + 1);

    // Fire-and-forget attempt log. RLS + triggers handle the rest.
    const supabase = getBrowserSupabase();
    await supabase.from("attempts").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      content_id: "contentId" in ex ? ex.contentId : null,
      exercise_kind: ex.kind,
      correct: result.correct,
      answer: value,
      expected,
    });
  }

  function next() {
    setIndex((i) => i + 1);
    setPicked(null);
    setRevealed(false);
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
        <span>
          {index + 1} / {session.length}
        </span>
        <span>{labelFor(ex)}</span>
      </div>

      <h1
        className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-ink md:text-3xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        {ex.prompt}
      </h1>

      {"sentence" in ex && (
        <p className="mt-4 text-lg leading-relaxed text-ink">"{ex.sentence}"</p>
      )}

      <div className="mt-8 grid gap-3">
        {options.map((opt) => {
          const isPicked = picked === opt.value;
          const isCorrect = opt.value === expected;
          const cls = !revealed
            ? "border-border hover:border-border-strong"
            : isCorrect
              ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
              : isPicked
                ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]"
                : "border-border opacity-60";
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              className={`rounded-xl border bg-surface px-5 py-4 text-left transition ${cls}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-base text-ink">{opt.label}</span>
                {opt.badge && <DialectBadge variant={opt.badge} size="sm" />}
              </div>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-6 space-y-2 rounded-lg border border-border bg-surface p-4">
          <div className="text-[11px] uppercase tracking-wide text-ink-subtle">
            {grade(expected, picked ?? "").correct ? "Correct" : "Not quite"}
          </div>
          {ex.clues.map((c, i) => (
            <div key={i} className="text-sm text-ink">
              {c}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button isDisabled={!revealed} onPress={next}>
          {index + 1 === session.length ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function buildSession(target: Variant, pool: ContentItem[]): Exercise[] {
  // Mix 3 spot + 3 choose-target from a shuffled pool, avoiding duplicates.
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, SESSION_LENGTH);
  return shuffled.map((item, i) => {
    if (i % 2 === 0) {
      // Show the OPPOSITE variant's sentence so the spot exercise is non-trivial.
      const probeVariant: Variant = Math.random() > 0.5 ? "uk" : "us";
      return buildSpotExercise(item, probeVariant);
    }
    return buildChooseTargetExercise(item, target);
  });
}

function getOptions(ex: Exercise): Array<{ value: string; label: string; badge?: Variant }> {
  switch (ex.kind) {
    case "spot_the_dialect":
      return [
        { value: "uk", label: "British", badge: "uk" },
        { value: "us", label: "American", badge: "us" },
      ];
    case "choose_target":
      return ex.options.map((o, i) => ({
        value: o,
        label: o,
        badge: i === 0 ? "uk" : "us",
      }));
    case "listen_and_identify":
      return [
        { value: "uk", label: "British", badge: "uk" },
        { value: "us", label: "American", badge: "us" },
      ];
    case "make_consistent":
      return [];
  }
}

function getExpected(ex: Exercise): string {
  switch (ex.kind) {
    case "spot_the_dialect":
    case "listen_and_identify":
      return ex.answer;
    case "choose_target":
      return ex.answer;
    case "make_consistent":
      return ex.expected;
  }
}

function labelFor(ex: Exercise): string {
  switch (ex.kind) {
    case "spot_the_dialect":
      return "Spot the dialect";
    case "choose_target":
      return "Choose the variant";
    case "listen_and_identify":
      return "Listen and identify";
    case "make_consistent":
      return "Make it consistent";
  }
}
