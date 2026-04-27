import Link from "next/link";
import { Brand } from "@/components/Brand";
import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Landing() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  return (
    <main className="mx-auto flex min-h-dvh max-w-[860px] flex-col px-6 py-16 md:py-24">
      <header className="flex items-center justify-between">
        <Brand />
        <Link
          href="/sign-in"
          className="rounded-md px-3 py-1.5 text-sm text-ink-muted hover:text-ink"
        >
          Sign in
        </Link>
      </header>

      <section className="mt-24 md:mt-32">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
          British · American · Consistent
        </p>
        <h1
          className="mt-3 max-w-[620px] text-4xl font-semibold tracking-tight text-ink md:text-5xl"
          style={{ letterSpacing: "-0.025em", lineHeight: 1.05 }}
        >
          Stop mixing your English.
        </h1>
        <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-ink-muted">
          A calm, deliberate way to learn British versus American English —
          detect the difference, understand why, and keep your writing
          consistent.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Start training
          </Link>
          <span className="text-sm text-ink-subtle">
            Free to try · no credit card
          </span>
        </div>
      </section>

      <section className="mt-24 grid gap-6 md:grid-cols-3">
        {[
          { title: "Detect", body: "Paste or type. See every British and American marker, with clues." },
          { title: "Understand", body: "Why 'organise' and not 'organize'. Why 'first floor' is not always the first floor." },
          { title: "Practise", body: "Short drills that train the contrasts you actually miss." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-surface p-5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
              {f.title}
            </div>
            <div className="mt-2 text-sm leading-relaxed text-ink">{f.body}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
