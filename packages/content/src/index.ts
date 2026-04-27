import type {
  ContentItem,
  ContrastCategory,
  DifficultyLevel,
} from "@english-variant/shared";
import { SEED_CONTENT } from "./seed";

export { SEED_CONTENT };

export function byId(id: string): ContentItem | undefined {
  return SEED_CONTENT.find((c) => c.id === id);
}

export function byCategory(category: ContrastCategory): ContentItem[] {
  return SEED_CONTENT.filter((c) => c.category === category);
}

export function byLevel(level: DifficultyLevel): ContentItem[] {
  return SEED_CONTENT.filter((c) => c.level === level);
}

/** Pick N items using a deterministic, seedable shuffle. */
export function sample(
  n: number,
  seed: number = Date.now(),
  pool: ContentItem[] = SEED_CONTENT,
): ContentItem[] {
  const copy = pool.slice();
  let random = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    random = (random * 9301 + 49297) % 233280;
    const r = random / 233280;
    const j = Math.floor(r * (i + 1));
    const a = copy[i] as ContentItem;
    const b = copy[j] as ContentItem;
    copy[i] = b;
    copy[j] = a;
  }
  return copy.slice(0, Math.min(n, copy.length));
}

export function dailyPick(dateIso: string = new Date().toISOString().slice(0, 10)): ContentItem {
  const seed = dateIso.split("-").reduce((a, b) => a * 31 + parseInt(b, 10), 7);
  const first = sample(1, seed)[0];
  if (!first) throw new Error("content empty");
  return first;
}

export const CONTENT_COUNT = SEED_CONTENT.length;
