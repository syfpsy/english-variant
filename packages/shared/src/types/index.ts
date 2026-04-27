/**
 * Core domain types. These mirror the Supabase schema and are shared
 * across web and mobile. Keep them narrow and UI-agnostic.
 */

export type Variant = "uk" | "us";

export type ContrastCategory =
  | "vocabulary"
  | "spelling"
  | "pronunciation"
  | "grammar"
  | "usage";

export type DifficultyLevel = 1 | 2 | 3;

export type ReasonTag = "travel" | "work" | "study" | "general_fluency";

export type ExerciseKind =
  | "spot_the_dialect"
  | "choose_target"
  | "make_consistent"
  | "listen_and_identify";

export interface ContrastExample {
  term: string;
  sentence: string;
  audioUrl: string | null;
  ipa?: string | null;
}

export interface ContentItem {
  id: string; // slug, stable
  category: ContrastCategory;
  level: DifficultyLevel;
  tags: string[];
  uk: ContrastExample;
  us: ContrastExample;
  /** Short editorial note about the contrast. */
  notes?: string;
  /** Detection clues the analyzer and UI can surface. */
  clues: string[];
  /** Optional confusion traps users fall into. */
  traps?: string[];
}

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  target_variant: Variant;
  reason_tags: ReasonTag[];
  updated_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  content_id: string | null;
  exercise_kind: ExerciseKind;
  correct: boolean;
  answer: string;
  expected: string;
  created_at: string;
}

export interface SavedItem {
  user_id: string;
  content_id: string;
  created_at: string;
}

export interface ReviewQueueEntry {
  user_id: string;
  content_id: string;
  /** Number of times missed; drives recall priority. */
  miss_count: number;
  last_seen_at: string;
}

export interface ProgressSummary {
  user_id: string;
  total_attempts: number;
  correct_attempts: number;
  streak_days: number;
  last_active_at: string | null;
}
