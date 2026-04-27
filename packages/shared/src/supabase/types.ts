/**
 * Hand-authored Supabase database types. Kept in sync with migrations manually
 * so we don't require the supabase-cli for type generation in this project.
 * Regenerate with `supabase gen types typescript --local > types.ts` when the
 * schema grows.
 *
 * Every table includes `Relationships: []` to satisfy the `GenericTable`
 * contract required by @supabase/postgrest-js's type inference — without it,
 * the Schema parameter resolves to `never` and query methods lose all typing.
 */

import type { ContrastCategory, ExerciseKind, ReasonTag, Variant } from "../types/index";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          target_variant: Variant;
          reason_tags: ReasonTag[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          target_variant: Variant;
          reason_tags?: ReasonTag[];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_preferences"]["Insert"]>;
        Relationships: [];
      };
      content_items: {
        Row: {
          id: string;
          category: ContrastCategory;
          level: number;
          tags: string[];
          uk: Json;
          us: Json;
          notes: string | null;
          clues: string[];
          traps: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          category: ContrastCategory;
          level: number;
          tags?: string[];
          uk: Json;
          us: Json;
          notes?: string | null;
          clues: string[];
          traps?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_items"]["Insert"]>;
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          content_id: string | null;
          exercise_kind: ExerciseKind;
          correct: boolean;
          answer: string;
          expected: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id?: string | null;
          exercise_kind: ExerciseKind;
          correct: boolean;
          answer: string;
          expected: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [];
      };
      saved_items: {
        Row: {
          user_id: string;
          content_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_items"]["Insert"]>;
        Relationships: [];
      };
      review_queue: {
        Row: {
          user_id: string;
          content_id: string;
          miss_count: number;
          last_seen_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          miss_count?: number;
          last_seen_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_queue"]["Insert"]>;
        Relationships: [];
      };
      progress_summary: {
        Row: {
          user_id: string;
          total_attempts: number;
          correct_attempts: number;
          streak_days: number;
          last_active_at: string | null;
        };
        Insert: {
          user_id: string;
          total_attempts?: number;
          correct_attempts?: number;
          streak_days?: number;
          last_active_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["progress_summary"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      variant: Variant;
      reason_tag: ReasonTag;
      contrast_category: ContrastCategory;
      exercise_kind: ExerciseKind;
    };
  };
}
