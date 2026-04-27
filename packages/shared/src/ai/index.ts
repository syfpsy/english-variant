/**
 * AI service interface. The app depends on this interface, not on any
 * particular provider. MVP ships with a `noopAiService` that returns
 * deterministic, rules-only output so the product works with zero API keys.
 *
 * Swap in a real provider by exporting a new implementation that satisfies
 * `AiService` and plugging it in at the app boundary.
 */

import type { Variant } from "../types/index";
import { analyze, rewrite } from "../analyzer/index";

export interface ExplainContrastInput {
  uk: { term: string; sentence: string };
  us: { term: string; sentence: string };
  clues: string[];
}

export interface ExplainMixedInput {
  text: string;
  target: Variant;
}

export interface AiExplanation {
  text: string;
  /** Short bulleted clues extracted from the explanation. */
  clues: string[];
}

export interface AiRewriteResult {
  rewritten: string;
  /** One-paragraph summary of what changed and why. */
  rationale: string;
}

export interface AiService {
  explainContrast(input: ExplainContrastInput): Promise<AiExplanation>;
  explainMixed(input: ExplainMixedInput): Promise<AiExplanation>;
  consistentRewrite(input: ExplainMixedInput): Promise<AiRewriteResult>;
}

/**
 * Deterministic, provider-free fallback. Uses the analyzer only.
 * Good enough for MVP. No network, no keys, no surprises.
 */
export const noopAiService: AiService = {
  async explainContrast({ uk, us, clues }) {
    return {
      text:
        `"${uk.term}" is British; "${us.term}" is American. ` +
        `In a UK sentence you'd say: "${uk.sentence}" — in a US sentence: "${us.sentence}".`,
      clues,
    };
  },
  async explainMixed({ text, target }) {
    const result = analyze(text);
    const offenders = result.findings.filter((f) => f.variant !== target);
    if (offenders.length === 0) {
      return {
        text: `This text is already consistently ${target === "uk" ? "British" : "American"} English.`,
        clues: [],
      };
    }
    const clues = Array.from(new Set(offenders.map((o) => o.clue)));
    return {
      text:
        `${offenders.length} marker${offenders.length === 1 ? "" : "s"} disagree with your target. ` +
        `The clearest signals: ${offenders.slice(0, 3).map((o) => `"${o.surface}"`).join(", ")}.`,
      clues,
    };
  },
  async consistentRewrite({ text, target }) {
    const r = rewrite(text, target);
    const rationale =
      r.changes.length === 0
        ? `No changes needed — already ${target === "uk" ? "British" : "American"} English.`
        : `${r.changes.length} replacement${r.changes.length === 1 ? "" : "s"} applied to make the text consistently ${target === "uk" ? "British" : "American"}.`;
    return { rewritten: r.text, rationale };
  },
};
