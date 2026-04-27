/**
 * Exercise generators. Pure functions that turn a ContentItem into a
 * runnable exercise payload. The UI renders the payload; grading is shared.
 */

import type {
  ContentItem,
  ExerciseKind,
  Variant,
} from "../types/index";

export interface SpotExercise {
  kind: "spot_the_dialect";
  contentId: string;
  prompt: string;
  sentence: string;
  audioUrl: string | null;
  answer: Variant;
  clues: string[];
}

export interface ChooseTargetExercise {
  kind: "choose_target";
  contentId: string;
  prompt: string;
  target: Variant;
  options: [string, string];
  answer: string;
  clues: string[];
}

export interface ListenExercise {
  kind: "listen_and_identify";
  contentId: string;
  prompt: string;
  audioUrl: string;
  answer: Variant;
  clues: string[];
}

export interface ConsistencyExercise {
  kind: "make_consistent";
  contentIds: string[];
  prompt: string;
  /** Deliberately mixed source text. */
  source: string;
  target: Variant;
  /** Accepted answer — the fully-consistent version. */
  expected: string;
  clues: string[];
}

export type Exercise =
  | SpotExercise
  | ChooseTargetExercise
  | ListenExercise
  | ConsistencyExercise;

export function buildSpotExercise(item: ContentItem, variant: Variant): SpotExercise {
  const source = variant === "uk" ? item.uk : item.us;
  return {
    kind: "spot_the_dialect",
    contentId: item.id,
    prompt: "Is this British or American?",
    sentence: source.sentence,
    audioUrl: source.audioUrl,
    answer: variant,
    clues: item.clues,
  };
}

export function buildChooseTargetExercise(
  item: ContentItem,
  target: Variant,
): ChooseTargetExercise {
  return {
    kind: "choose_target",
    contentId: item.id,
    prompt:
      target === "uk"
        ? "Pick the British version"
        : "Pick the American version",
    target,
    options: [item.uk.term, item.us.term],
    answer: target === "uk" ? item.uk.term : item.us.term,
    clues: item.clues,
  };
}

export function buildListenExercise(
  item: ContentItem,
  variant: Variant,
): ListenExercise | null {
  const source = variant === "uk" ? item.uk : item.us;
  if (!source.audioUrl) return null;
  return {
    kind: "listen_and_identify",
    contentId: item.id,
    prompt: "Which accent is this?",
    audioUrl: source.audioUrl,
    answer: variant,
    clues: item.clues,
  };
}

/**
 * Grader — pure. Returns { correct, normalized } so the UI doesn't
 * reinvent string comparison.
 */
export function grade(expected: string, answer: string): {
  correct: boolean;
  normalizedExpected: string;
  normalizedAnswer: string;
} {
  const norm = (s: string) =>
    s.trim().replace(/\s+/g, " ").replace(/[.,!?;:]$/g, "").toLowerCase();
  const ne = norm(expected);
  const na = norm(answer);
  return { correct: ne === na, normalizedExpected: ne, normalizedAnswer: na };
}

export const EXERCISE_KIND_LABEL: Record<ExerciseKind, string> = {
  spot_the_dialect: "Spot the dialect",
  choose_target: "Choose the variant",
  make_consistent: "Make it consistent",
  listen_and_identify: "Listen and identify",
};
