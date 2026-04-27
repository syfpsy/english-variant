import { z } from "zod";

export const VariantSchema = z.enum(["uk", "us"]);

export const ContrastCategorySchema = z.enum([
  "vocabulary",
  "spelling",
  "pronunciation",
  "grammar",
  "usage",
]);

export const DifficultyLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const ReasonTagSchema = z.enum([
  "travel",
  "work",
  "study",
  "general_fluency",
]);

export const ExerciseKindSchema = z.enum([
  "spot_the_dialect",
  "choose_target",
  "make_consistent",
  "listen_and_identify",
]);

export const ContrastExampleSchema = z.object({
  term: z.string().min(1),
  sentence: z.string().min(1),
  audioUrl: z.string().url().nullable(),
  ipa: z.string().nullable().optional(),
});

export const ContentItemSchema = z.object({
  id: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  category: ContrastCategorySchema,
  level: DifficultyLevelSchema,
  tags: z.array(z.string()).default([]),
  uk: ContrastExampleSchema,
  us: ContrastExampleSchema,
  notes: z.string().optional(),
  clues: z.array(z.string()).min(1),
  traps: z.array(z.string()).optional(),
});

export const OnboardingInputSchema = z.object({
  target_variant: VariantSchema,
  reason_tags: z.array(ReasonTagSchema).max(4),
});

export const AttemptInputSchema = z.object({
  content_id: z.string().nullable(),
  exercise_kind: ExerciseKindSchema,
  correct: z.boolean(),
  answer: z.string(),
  expected: z.string(),
});

export type ContentItemInput = z.infer<typeof ContentItemSchema>;
export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;
export type AttemptInput = z.infer<typeof AttemptInputSchema>;
