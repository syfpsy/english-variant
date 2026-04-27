import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { analyze } from "@english-variant/shared";
import { VariantSchema } from "@english-variant/shared/schemas";
import { chat, openRouterConfigured } from "@/lib/ai/openrouter";
import { getServerSupabase } from "@/lib/supabase/server";

const BodySchema = z.object({
  text: z.string().min(1).max(4000),
  target: VariantSchema,
});

/**
 * Takes a chunk of user text and a target variant, returns a short, human
 * explanation of the mixed markers + suggested edits. Falls back to the
 * deterministic analyzer summary if no OpenRouter key is configured.
 */
export async function POST(request: NextRequest) {
  // Authed-only — avoids burning tokens for anonymous traffic.
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { text, target } = parsed.data;

  // The deterministic analyzer is the source of truth for WHAT is mixed;
  // the LLM is only asked to phrase the explanation well.
  const findings = analyze(text);

  if (!openRouterConfigured() || findings.findings.length === 0) {
    return NextResponse.json({
      source: "deterministic",
      summary: findings.summary,
      clues: Array.from(new Set(findings.findings.map((f) => f.clue))),
    });
  }

  const markerList = findings.findings
    .map(
      (f) =>
        `- "${f.surface}" (${f.variant.toUpperCase()}, ${f.category}) → equivalent in the other variant: "${f.counterpart}". Clue: ${f.clue}`,
    )
    .join("\n");

  const system =
    "You are an editorial voice expert in British vs American English. " +
    "Given a text and a list of dialect markers, write one short paragraph (max 60 words) " +
    "explaining the inconsistency pattern in plain English, and a one-line tip for the writer. " +
    "Be warm, precise, and non-condescending. Do not list every marker — synthesise the pattern.";

  const userMsg =
    `Target variant: ${target === "uk" ? "British" : "American"}.\n` +
    `Text:\n"""${text}"""\n\n` +
    `Detected markers:\n${markerList}\n\n` +
    `Write: paragraph, then a single-line tip prefixed with "Tip: ".`;

  try {
    const result = await chat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });
    return NextResponse.json({
      source: "ai",
      model: result.model,
      text: result.text,
      summary: findings.summary,
      clues: Array.from(new Set(findings.findings.map((f) => f.clue))),
    });
  } catch (err) {
    return NextResponse.json(
      {
        source: "deterministic",
        summary: findings.summary,
        clues: Array.from(new Set(findings.findings.map((f) => f.clue))),
        error: err instanceof Error ? err.message : "ai call failed",
      },
      { status: 200 },
    );
  }
}
