"use client";

import type { Finding } from "@english-variant/shared";

/**
 * Renders text with inline dialect markers highlighted. Uses a native title
 * attribute for the hover clue — deliberately lightweight, since the clues
 * also appear in the aggregated panel next to the text.
 */
export function MarkerText({
  text,
  findings,
}: {
  text: string;
  findings: Finding[];
}) {
  if (findings.length === 0) {
    return <p className="whitespace-pre-wrap leading-relaxed text-ink">{text}</p>;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < findings.length; i++) {
    const f = findings[i]!;
    if (f.start > cursor) {
      nodes.push(<span key={`t-${cursor}`}>{text.slice(cursor, f.start)}</span>);
    }
    nodes.push(
      <mark
        key={`m-${i}`}
        className={f.variant === "uk" ? "mark-uk" : "mark-us"}
        title={`${f.variant.toUpperCase()} · ${f.clue} — equivalent: ${f.counterpart}`}
      >
        {f.surface}
      </mark>,
    );
    cursor = f.end;
  }
  if (cursor < text.length) nodes.push(<span key="t-end">{text.slice(cursor)}</span>);

  return <p className="whitespace-pre-wrap leading-relaxed text-ink">{nodes}</p>;
}
