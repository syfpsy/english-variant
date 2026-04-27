"use client";

import { useEffect, useMemo, useState } from "react";
import { SEED_CONTENT } from "@english-variant/content";
import { DialectBadge } from "@/components/DialectBadge";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { ContrastCategory } from "@english-variant/shared";

const CATEGORIES: ContrastCategory[] = [
  "vocabulary",
  "spelling",
  "pronunciation",
  "grammar",
  "usage",
];

export default function BrowsePage() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ContrastCategory | "all">("all");
  const [query, setQuery] = useState("");

  // Load saved items on mount
  useEffect(() => {
    (async () => {
      const supabase = getBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("saved_items")
        .select("content_id")
        .eq("user_id", user.id);
      if (data) setSavedIds(new Set(data.map((r) => r.content_id)));
    })();
  }, []);

  async function toggleSave(contentId: string) {
    const supabase = getBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (savedIds.has(contentId)) {
      await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("content_id", contentId);
      setSavedIds((prev) => {
        const n = new Set(prev);
        n.delete(contentId);
        return n;
      });
    } else {
      await supabase
        .from("saved_items")
        .upsert({ user_id: user.id, content_id: contentId });
      setSavedIds((prev) => new Set([...prev, contentId]));
    }
  }

  const items = useMemo(() => {
    let list = SEED_CONTENT;
    if (filter !== "all") list = list.filter((c) => c.category === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.uk.term.toLowerCase().includes(q) ||
          c.us.term.toLowerCase().includes(q) ||
          c.clues.some((cl) => cl.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [filter, query]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
          Library
        </p>
        <h1
          className="mt-1 text-3xl font-semibold tracking-tight text-ink"
          style={{ letterSpacing: "-0.02em" }}
        >
          All {SEED_CONTENT.length} contrasts.
        </h1>
        <p className="mt-2 max-w-[560px] text-sm text-ink-muted">
          Browse, search, and save any contrast to your review deck.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms or clues…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {CATEGORIES.map((c) => (
            <FilterPill
              key={c}
              label={c.charAt(0).toUpperCase() + c.slice(1)}
              active={filter === c}
              onClick={() => setFilter(c)}
            />
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink-muted">
          No contrasts match "{query}".
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isSaved = savedIds.has(item.id);
            return (
              <li
                key={item.id}
                className="relative rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-ink-subtle">
                    {item.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSave(item.id)}
                    title={isSaved ? "Remove from saved" : "Save for review"}
                    className={`-mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[12px] transition ${
                      isSaved
                        ? "text-accent font-medium"
                        : "text-ink-subtle hover:text-ink"
                    }`}
                  >
                    {isSaved ? "Saved ✓" : "Save"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <DialectBadge variant="uk" label={`UK: ${item.uk.term}`} size="sm" />
                  <DialectBadge variant="us" label={`US: ${item.us.term}`} size="sm" />
                </div>

                {item.clues[0] && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {item.clues[0]}
                  </p>
                )}

                {item.uk.sentence && (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-subtle">
                    "{item.uk.sentence}"
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[12px] transition ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
