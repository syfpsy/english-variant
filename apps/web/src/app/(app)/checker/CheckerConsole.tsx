"use client";

import { useMemo, useState } from "react";
import { Button, TextArea } from "@/components/ui";
import {
  analyze,
  rewrite,
  type AnalysisResult,
  type Variant,
} from "@english-variant/shared";
import { DialectBadge } from "@/components/DialectBadge";
import { MarkerText } from "@/components/MarkerText";

const SAMPLE = `I travelled to New York last autumn and organised a small office in a flat near the centre. My neighbour parks his car on the pavement, so I complained to the apartment building manager. We favor a consistent tone across our writing.`;

export function CheckerConsole({ target }: { target: Variant }) {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<Variant>(target);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const result: AnalysisResult = useMemo(() => analyze(input), [input]);
  const rewritten = useMemo(() => rewrite(input, active), [input, active]);

  async function askAi() {
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, target: active }),
      });
      const json = await res.json();
      setAiExplanation(json.text ?? json.summary ?? "No explanation returned.");
    } catch (err) {
      setAiExplanation(err instanceof Error ? err.message : "AI call failed.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
          Checker
        </p>
        <h1
          className="mt-1 text-3xl font-semibold tracking-tight text-ink"
          style={{ letterSpacing: "-0.02em" }}
        >
          Paste your text. See what's British and what's American.
        </h1>
        <p className="mt-2 max-w-[560px] text-sm text-ink-muted">
          Every marker is explained. One click rewrites the whole thing into a
          single, consistent variant.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Your text</label>
            <button
              type="button"
              onClick={() => setInput(SAMPLE)}
              className="text-[12px] text-ink-muted hover:text-ink"
            >
              Try a sample →
            </button>
          </div>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            minRows={10}
            placeholder="Paste or type anything — a paragraph, an email, a product description…"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-ink-subtle">
            <span>{input.length} characters</span>
            <span>{result.findings.length} markers</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
                Verdict
              </div>
              {result.verdict && (
                <DialectBadge
                  variant={result.verdict}
                  size="sm"
                />
              )}
            </div>
            <div className="mt-2 text-ink">{result.summary}</div>
            {result.findings.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Meter label="British" count={result.ukCount} variant="uk" />
                <Meter label="American" count={result.usCount} variant="us" />
              </div>
            )}
          </div>

          {result.findings.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
                Clues
              </div>
              <ul className="mt-3 space-y-2">
                {dedupe(result.findings.map((f) => f.clue)).map((c, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-ink before:mr-2 before:text-ink-subtle before:content-['·']"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {input.trim().length > 0 && (
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
                Highlighted
              </div>
            </div>
            <MarkerText text={result.text} findings={result.findings} />
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
                Consistent rewrite
              </div>
              <div className="flex gap-1 rounded-lg border border-border p-1">
                {(["uk", "us"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setActive(v)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      active === v
                        ? v === "uk"
                          ? "bg-[var(--color-uk-soft)] text-uk"
                          : "bg-[var(--color-us-soft)] text-us"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {v === "uk" ? "British" : "American"}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-ink">
              {rewritten.text || (
                <span className="text-ink-subtle">Paste some text to see it rewritten.</span>
              )}
            </p>
            {rewritten.changes.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
                  {rewritten.changes.length} change
                  {rewritten.changes.length === 1 ? "" : "s"}
                </div>
                <ul className="mt-3 space-y-2">
                  {rewritten.changes.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-baseline gap-3 text-sm text-ink"
                    >
                      <span className="font-mono text-ink-muted line-through">
                        {c.from}
                      </span>
                      <span className="text-ink-subtle">→</span>
                      <span className="font-mono font-medium text-ink">
                        {c.to}
                      </span>
                      <span className="ml-auto text-[12px] text-ink-muted">
                        {c.clue}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      if (typeof navigator !== "undefined") {
                        navigator.clipboard.writeText(rewritten.text);
                      }
                    }}
                  >
                    Copy rewrite
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={input.trim().length === 0}
                    isLoading={aiLoading}
                    onPress={askAi}
                  >
                    Explain with AI
                  </Button>
                </div>
                {aiExplanation && (
                  <div className="mt-4 rounded-lg border border-border bg-[var(--color-accent-soft)] p-4 text-sm leading-relaxed text-ink">
                    {aiExplanation}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Meter({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: Variant;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <div className="text-sm text-ink">{label}</div>
      <div className="flex items-center gap-2">
        <DialectBadge variant={variant} size="sm" />
        <span className="tabular-nums text-sm font-medium text-ink">{count}</span>
      </div>
    </div>
  );
}

function dedupe(xs: string[]): string[] {
  return Array.from(new Set(xs));
}
