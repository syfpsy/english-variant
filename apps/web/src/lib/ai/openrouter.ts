/**
 * Server-side OpenRouter client. Keep this off the client bundle — no
 * "use client" here, and callers must live in a route handler or server
 * component.
 *
 * OpenRouter is a single-endpoint gateway across many providers. We use it
 * because a single API key unlocks Claude, GPT, Gemini, etc. behind a stable
 * OpenAI-compatible interface.
 */

import "server-only";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** Defaults to $OPENROUTER_MODEL or Claude Sonnet 4.5. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  text: string;
  model: string;
  usage?: { prompt: number; completion: number };
}

export function openRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function chat({
  messages,
  model,
  temperature = 0.3,
  maxTokens = 600,
}: ChatRequest): Promise<ChatResponse> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const resolvedModel = model ?? process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      // OpenRouter uses these for attribution/rate-limit dashboards.
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://english-variant.vercel.app",
      "X-Title": "English Variant",
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`openrouter ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
    model?: string;
  };

  const text = json.choices[0]?.message?.content ?? "";
  return {
    text,
    model: json.model ?? resolvedModel,
    usage: json.usage
      ? { prompt: json.usage.prompt_tokens, completion: json.usage.completion_tokens }
      : undefined,
  };
}
