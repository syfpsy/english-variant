/**
 * Dialect analyzer — detects British vs American markers in text.
 *
 * Two passes:
 *   1. Lexicon lookup (phrases first, then single words).
 *   2. Suffix rules for systematic spelling contrasts.
 *
 * Design goals:
 *   - High precision. We'd rather miss a marker than mislabel a word.
 *   - Every finding carries a human-readable clue so the UI can explain WHY.
 *   - Results are pure data; rendering is the app's job.
 */

import type { Variant } from "../types/index";
import { LEXICON, SUFFIX_RULES, type LexiconEntry } from "./rules";

export interface Finding {
  /** Character offsets into the original input. */
  start: number;
  end: number;
  /** The exact substring that matched. */
  surface: string;
  /** Variant this marker signals. */
  variant: Variant;
  /** The equivalent in the other variant (preserving case). */
  counterpart: string;
  /** Short explanation for the UI. */
  clue: string;
  /** Detection type for styling/grouping. */
  kind: "lexicon" | "suffix";
  /** Category tag for analytics. */
  category: "vocabulary" | "spelling" | "grammar" | "usage";
}

export interface AnalysisResult {
  text: string;
  findings: Finding[];
  /** Counts of UK/US markers found. */
  ukCount: number;
  usCount: number;
  /** High-confidence verdict for the whole input. null = inconclusive. */
  verdict: Variant | "mixed" | null;
  /** Readiness-for-display summary. */
  summary: string;
}

export interface RewriteResult {
  text: string;
  /** The changes made, with positions in the ORIGINAL text. */
  changes: Array<{
    start: number;
    end: number;
    from: string;
    to: string;
    clue: string;
  }>;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function analyze(input: string): AnalysisResult {
  const findings: Finding[] = [];
  const claimed = new IntervalSet();

  // Pass 1a: multi-word lexicon entries (longest first to avoid sub-matches).
  const phrases = LEXICON.filter((e) => e.uk.includes(" ") || e.us.includes(" "))
    .slice()
    .sort((a, b) => Math.max(b.uk.length, b.us.length) - Math.max(a.uk.length, a.us.length));

  for (const entry of phrases) {
    findLexiconMatches(input, entry, "uk", claimed, findings);
    findLexiconMatches(input, entry, "us", claimed, findings);
  }

  // Pass 1b: single-word lexicon entries.
  const words = LEXICON.filter((e) => !e.uk.includes(" ") && !e.us.includes(" "));
  for (const entry of words) {
    findLexiconMatches(input, entry, "uk", claimed, findings);
    findLexiconMatches(input, entry, "us", claimed, findings);
  }

  // Pass 2: suffix rules.
  for (const rule of SUFFIX_RULES) {
    scanWithRule(input, rule, "uk", claimed, findings);
    scanWithRule(input, rule, "us", claimed, findings);
  }

  findings.sort((a, b) => a.start - b.start);

  const ukCount = findings.filter((f) => f.variant === "uk").length;
  const usCount = findings.filter((f) => f.variant === "us").length;
  const verdict = deriveVerdict(ukCount, usCount);

  return {
    text: input,
    findings,
    ukCount,
    usCount,
    verdict,
    summary: buildSummary(verdict, ukCount, usCount),
  };
}

/**
 * Rewrite text into a target variant using the same findings.
 * Only markers that disagree with the target are changed. Returns both
 * the new text and the list of edits so the UI can highlight them.
 */
export function rewrite(input: string, target: Variant): RewriteResult {
  const { findings } = analyze(input);
  const edits = findings.filter((f) => f.variant !== target);

  // Apply edits from right to left so offsets remain valid.
  edits.sort((a, b) => b.start - a.start);

  let text = input;
  const changes: RewriteResult["changes"] = [];

  for (const f of edits) {
    const replacement = f.counterpart;
    text = text.slice(0, f.start) + replacement + text.slice(f.end);
    changes.unshift({
      start: f.start,
      end: f.end,
      from: f.surface,
      to: replacement,
      clue: f.clue,
    });
  }

  return { text, changes };
}

// ─── Internals ──────────────────────────────────────────────────────────────

function findLexiconMatches(
  input: string,
  entry: LexiconEntry,
  variant: Variant,
  claimed: IntervalSet,
  out: Finding[],
): void {
  const needle = variant === "uk" ? entry.uk : entry.us;
  const pattern = entry.uk.includes(" ") || entry.us.includes(" ")
    ? new RegExp(escapeRegex(needle), "gi")
    : new RegExp(`\\b${escapeRegex(needle)}\\b`, "gi");

  for (const match of input.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (claimed.overlaps(start, end)) continue;

    const counterpart = matchCase(match[0], variant === "uk" ? entry.us : entry.uk);
    out.push({
      start,
      end,
      surface: match[0],
      variant,
      counterpart,
      clue: entry.clue,
      kind: "lexicon",
      category: entry.category,
    });
    claimed.add(start, end);
  }
}

function scanWithRule(
  input: string,
  rule: (typeof SUFFIX_RULES)[number],
  variant: Variant,
  claimed: IntervalSet,
  out: Finding[],
): void {
  const pattern = variant === "uk" ? rule.ukPattern : rule.usPattern;
  const replacement = variant === "uk" ? rule.ukToUs : rule.usToUk;
  const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");

  for (const match of input.matchAll(global)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (claimed.overlaps(start, end)) continue;
    if (isExcepted(match[0], rule.exceptions)) continue;

    // Apply the rule's replacement, preserving the captured groups.
    const counterpart = match[0].replace(pattern, replacement);
    if (counterpart.toLowerCase() === match[0].toLowerCase()) continue;

    out.push({
      start,
      end,
      surface: match[0],
      variant,
      counterpart: matchCase(match[0], counterpart),
      clue: rule.clue,
      kind: "suffix",
      category: "spelling",
    });
    claimed.add(start, end);
  }
}

function deriveVerdict(uk: number, us: number): Variant | "mixed" | null {
  if (uk === 0 && us === 0) return null;
  if (uk > 0 && us > 0) return "mixed";
  return uk > us ? "uk" : "us";
}

function buildSummary(
  verdict: Variant | "mixed" | null,
  uk: number,
  us: number,
): string {
  switch (verdict) {
    case null:
      return "No dialect markers detected. The text is too neutral to classify.";
    case "uk":
      return `British English. ${uk} marker${uk === 1 ? "" : "s"} found.`;
    case "us":
      return `American English. ${us} marker${us === 1 ? "" : "s"} found.`;
    case "mixed":
      return `Mixed dialect — ${uk} British and ${us} American marker${uk + us === 1 ? "" : "s"}.`;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Preserve the capitalization pattern of the original surface. */
function matchCase(original: string, replacement: string): string {
  if (!original) return replacement;
  if (original.toUpperCase() === original) return replacement.toUpperCase();
  if (original[0] && original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Excepted matches are checked against their lemma-ish form: we strip common
 * inflectional suffixes so "promised" is caught by the "promise" exception.
 */
function isExcepted(surface: string, exceptions: Set<string> | undefined): boolean {
  if (!exceptions || exceptions.size === 0) return false;
  const lower = surface.toLowerCase();
  if (exceptions.has(lower)) return true;
  // Try progressively broader lemma reductions — cover the common inflections
  // of -ise verbs: -ises, -ised, -ising, -iser, -isers.
  const stems = new Set<string>();
  const m = lower.match(/^(.*?)(ises|ised|ising|iser|isers|izes|ized|izing|izer|izers|es|ed|ing|er|ers|s|d|r|rs)$/i);
  if (m) {
    const base = m[1]!;
    stems.add(base);
    stems.add(base + "e");
    if (base.endsWith("is")) stems.add(base + "e");
    if (base.endsWith("iz")) stems.add(base.slice(0, -2) + "ise");
  }
  stems.add(lower.replace(/(ed|ing|er|ers|es|s|d|r|rs)$/i, ""));
  stems.add(lower.replace(/ing$/i, "e"));
  stems.add(lower.replace(/ed$/i, "e"));
  stems.add(lower.replace(/ed$/i, ""));
  for (const stem of stems) {
    if (stem && exceptions.has(stem)) return true;
  }
  return false;
}

/** Tracks character intervals already claimed by earlier matches. */
class IntervalSet {
  private ranges: Array<[number, number]> = [];
  overlaps(start: number, end: number): boolean {
    return this.ranges.some(([s, e]) => start < e && end > s);
  }
  add(start: number, end: number): void {
    this.ranges.push([start, end]);
  }
}
