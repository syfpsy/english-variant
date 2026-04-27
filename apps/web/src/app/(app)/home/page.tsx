import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { dailyPick, CONTENT_COUNT } from "@english-variant/content";
import { DialectBadge } from "@/components/DialectBadge";

export default async function HomePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: prefs }, { data: recent }, { data: saved }, { data: progress }] =
    await Promise.all([
      supabase.from("user_preferences").select("target_variant, reason_tags").single(),
      supabase
        .from("attempts")
        .select("id, content_id, exercise_kind, correct, answer, expected, created_at")
        .eq("user_id", user!.id)
        .eq("correct", false)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("saved_items")
        .select("content_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("progress_summary")
        .select("total_attempts, correct_attempts, streak_days")
        .maybeSingle(),
    ]);

  const target = prefs?.target_variant ?? "uk";
  const daily = dailyPick();
  const example = target === "uk" ? daily.uk : daily.us;
  const accuracy =
    progress && progress.total_attempts > 0
      ? Math.round((progress.correct_attempts / progress.total_attempts) * 100)
      : null;

  return (
    <div className="space-y-10">
      <section>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
          Today
        </p>
        <h1
          className="mt-1 text-3xl font-semibold tracking-tight text-ink"
          style={{ letterSpacing: "-0.02em" }}
        >
          One contrast a day.
        </h1>
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <DialectBadge variant={target} label={`Target: ${target.toUpperCase()}`} />
            <span className="text-[11px] uppercase tracking-wide text-ink-subtle">
              {daily.category}
            </span>
          </div>
          <div className="mt-4 text-[22px] leading-snug text-ink">
            "{example.sentence}"
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <DialectBadge variant="uk" label={`UK: ${daily.uk.term}`} size="sm" />
            <DialectBadge variant="us" label={`US: ${daily.us.term}`} size="sm" />
          </div>
          {daily.clues[0] && (
            <p className="mt-4 text-sm text-ink-muted">{daily.clues[0]}</p>
          )}
          <div className="mt-6">
            <Link
              href="/practice"
              className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Train this pattern
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Streak"
          value={progress?.streak_days ?? 0}
          unit={progress?.streak_days === 1 ? "day" : "days"}
        />
        <StatCard
          label="Accuracy"
          value={accuracy ?? "—"}
          unit={accuracy !== null ? "%" : ""}
        />
        <StatCard label="Library" value={CONTENT_COUNT} unit="contrasts" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Panel title="Recent mistakes" href="/review" hrefLabel="Review all">
          {recent && recent.length > 0 ? (
            <ul className="space-y-3">
              {recent.map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="text-ink">
                    You wrote <span className="font-medium">{a.answer}</span>.
                  </div>
                  <div className="text-ink-muted">
                    Expected <span className="font-medium">{a.expected}</span>.
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              No mistakes yet. Do a quick practice and we'll build your review deck.
            </p>
          )}
        </Panel>

        <Panel title="Saved" href="/review" hrefLabel="Open saved">
          {saved && saved.length > 0 ? (
            <ul className="space-y-2 text-sm text-ink">
              {saved.map((s) => (
                <li key={s.content_id}>{s.content_id}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              Save any contrast to revisit it. Tap a word while practising.
            </p>
          )}
        </Panel>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-ink">
          {value}
        </span>
        {unit && <span className="text-sm text-ink-muted">{unit}</span>}
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
        <Link
          href={href as never}
          className="text-[12px] text-ink-muted hover:text-ink"
        >
          {hrefLabel} →
        </Link>
      </div>
      {children}
    </div>
  );
}
