"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { ReasonTag, Variant } from "@english-variant/shared";

const REASONS: Array<{ id: ReasonTag; label: string }> = [
  { id: "travel", label: "Travel" },
  { id: "work", label: "Work" },
  { id: "study", label: "Study" },
  { id: "general_fluency", label: "General fluency" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [variant, setVariant] = useState<Variant | null>(null);
  const [reasons, setReasons] = useState<Set<ReasonTag>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleReason(id: ReasonTag) {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!variant) return;
    setPending(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setPending(false);
      return;
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      target_variant: variant,
      reason_tags: Array.from(reasons),
    });

    setPending(false);
    if (error) setError(error.message);
    else router.replace("/home");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-6 py-16">
      <div className="mb-10">
        <Brand />
      </div>

      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
        Step 1 of 1
      </p>
      <h1
        className="mt-2 text-3xl font-semibold tracking-tight text-ink"
        style={{ letterSpacing: "-0.02em" }}
      >
        Which English are you aiming for?
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        We'll train you toward this variant and nudge inconsistencies along the way.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {(
          [
            { id: "uk", title: "British", desc: "Colour, centre, holiday." },
            { id: "us", title: "American", desc: "Color, center, vacation." },
          ] as const
        ).map((v) => {
          const selected = variant === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariant(v.id)}
              className={`rounded-xl border bg-surface p-4 text-left transition ${
                selected
                  ? "border-accent ring-2 ring-accent-soft"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] uppercase tracking-wide ${
                    v.id === "uk" ? "text-uk" : "text-us"
                  }`}
                >
                  {v.id === "uk" ? "UK" : "US"}
                </span>
                {selected && (
                  <span className="text-[11px] font-medium text-accent">Selected</span>
                )}
              </div>
              <div className="mt-2 text-lg font-semibold text-ink">{v.title}</div>
              <div className="mt-1 text-[13px] text-ink-muted">{v.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="text-sm font-medium text-ink">Why are you learning?</div>
        <div className="mt-1 text-[13px] text-ink-muted">Optional, pick any that apply.</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {REASONS.map((r) => {
            const selected = reasons.has(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleReason(r.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                  selected
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-ink-muted hover:border-border-strong"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <p className="text-xs text-ink-subtle">You can change this later.</p>
        <Button
          isDisabled={!variant}
          isLoading={pending}
          onPress={save}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </main>
  );
}
