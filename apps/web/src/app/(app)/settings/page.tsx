"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Variant } from "@english-variant/shared";

export default function SettingsPage() {
  const router = useRouter();
  const [active, setActive] = useState<Variant | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!active) return;
    setSaving(true);
    const supabase = getBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_preferences").upsert({ user_id: user.id, target_variant: active });
    }
    setSaving(false);
    router.push("/home");
  }

  return (
    <div className="max-w-[520px] space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink" style={{ letterSpacing: "-0.02em" }}>
          Preferences
        </h1>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="text-sm font-medium text-ink">Target variant</div>
        <p className="mt-1 text-sm text-ink-muted">Which English are you practising toward?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(["uk", "us"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActive(v)}
              className={`rounded-xl border p-4 text-left transition ${
                active === v
                  ? "border-accent ring-2 ring-accent-soft"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <span className={`text-[11px] uppercase tracking-wide ${v === "uk" ? "text-uk" : "text-us"}`}>
                {v.toUpperCase()}
              </span>
              <div className="mt-1 text-base font-semibold text-ink">
                {v === "uk" ? "British" : "American"}
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button isDisabled={!active} isLoading={saving} onPress={save}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
