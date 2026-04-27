import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { byId } from "@english-variant/content";
import { DialectBadge } from "@/components/DialectBadge";

export default async function ReviewPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: queue }, { data: saved }] = await Promise.all([
    supabase
      .from("review_queue")
      .select("content_id, miss_count, last_seen_at")
      .eq("user_id", user!.id)
      .order("miss_count", { ascending: false })
      .limit(50),
    supabase
      .from("saved_items")
      .select("content_id, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  type QueueRow = NonNullable<typeof queue>[number];
  type SavedRow = NonNullable<typeof saved>[number];

  const queueItems = ((queue ?? []) as QueueRow[])
    .map((q) => ({ ...q, content: byId(q.content_id) }))
    .filter(
      (q): q is QueueRow & { content: NonNullable<ReturnType<typeof byId>> } =>
        !!q.content,
    );

  const savedItems = ((saved ?? []) as SavedRow[])
    .map((s) => ({ ...s, content: byId(s.content_id) }))
    .filter(
      (s): s is SavedRow & { content: NonNullable<ReturnType<typeof byId>> } =>
        !!s.content,
    );

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
          Review
        </p>
        <h1
          className="mt-1 text-3xl font-semibold tracking-tight text-ink"
          style={{ letterSpacing: "-0.02em" }}
        >
          Your missed contrasts.
        </h1>
        <p className="mt-2 max-w-[560px] text-sm text-ink-muted">
          When you miss an item, it shows up here until you get it right twice.
          Saved items live beside them.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-medium text-ink">
          Review queue · {queueItems.length}
        </h2>
        {queueItems.length === 0 ? (
          <EmptyHint>
            No items in review. Run a{" "}
            <Link href="/practice" className="underline underline-offset-2">
              practice set
            </Link>{" "}
            — anything you miss lands here.
          </EmptyHint>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {queueItems.map((q) => (
              <li
                key={q.content_id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wide text-ink-subtle">
                    {q.content.category}
                  </div>
                  <span className="rounded-full bg-[var(--color-warning-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
                    Missed ×{q.miss_count}
                  </span>
                </div>
                <div className="mt-3 text-base text-ink">
                  <DialectBadge variant="uk" label={`UK: ${q.content.uk.term}`} size="sm" />
                  <span className="mx-2 text-ink-subtle">·</span>
                  <DialectBadge variant="us" label={`US: ${q.content.us.term}`} size="sm" />
                </div>
                {q.content.clues[0] && (
                  <p className="mt-3 text-sm text-ink-muted">{q.content.clues[0]}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-ink">
          Saved · {savedItems.length}
        </h2>
        {savedItems.length === 0 ? (
          <EmptyHint>Nothing saved yet.</EmptyHint>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {savedItems.map((s) => (
              <li
                key={s.content_id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="text-[11px] uppercase tracking-wide text-ink-subtle">
                  {s.content.category}
                </div>
                <div className="mt-3 flex gap-2">
                  <DialectBadge variant="uk" label={`UK: ${s.content.uk.term}`} size="sm" />
                  <DialectBadge variant="us" label={`US: ${s.content.us.term}`} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/60 p-6 text-sm text-ink-muted">
      {children}
    </div>
  );
}
