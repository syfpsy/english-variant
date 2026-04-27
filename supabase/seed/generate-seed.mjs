/**
 * Generates supabase/seed.sql from packages/content/src/seed.ts.
 * Run with: node supabase/seed/generate-seed.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

// We evaluate seed.ts by stripping imports and exporting JSON.
// Keeping the generator tiny — no bundler required.
const seedPath = resolve(root, "packages/content/src/seed.ts");
const raw = await readFile(seedPath, "utf8");

// Extract the array literal between `export const SEED_CONTENT: ContentItem[] = [` and the matching `];`.
const startMatch = raw.match(/export const SEED_CONTENT[^=]*=\s*\[/);
if (!startMatch) throw new Error("couldn't find SEED_CONTENT in seed.ts");
const start = startMatch.index + startMatch[0].length - 1;
let depth = 0;
let end = -1;
for (let i = start; i < raw.length; i++) {
  const c = raw[i];
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
if (end === -1) throw new Error("couldn't find end of SEED_CONTENT array");

const arrayLiteral = raw.slice(start, end);

// Use dynamic import-via-data-url trick: evaluate as JS.
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(`export default ${arrayLiteral};`).toString("base64")
);
const items = module.default;

function esc(s) {
  if (s === null || s === undefined) return "null";
  return `'${String(s).replace(/'/g, "''")}'`;
}
function arr(a) {
  if (!a || a.length === 0) return "ARRAY[]::text[]";
  return `ARRAY[${a.map(esc).join(", ")}]::text[]`;
}
function jsonb(obj) {
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

const values = items
  .map(
    (it) =>
      `  (${esc(it.id)}, ${esc(it.category)}, ${it.level}, ${arr(it.tags)}, ${jsonb(it.uk)}, ${jsonb(it.us)}, ${esc(it.notes ?? null)}, ${arr(it.clues)}, ${arr(it.traps ?? [])})`,
  )
  .join(",\n");

const sql = `-- Generated from packages/content/src/seed.ts. Do not edit by hand.
-- Regenerate: node supabase/seed/generate-seed.mjs

insert into public.content_items (id, category, level, tags, uk, us, notes, clues, traps) values
${values}
on conflict (id) do update set
  category = excluded.category,
  level = excluded.level,
  tags = excluded.tags,
  uk = excluded.uk,
  us = excluded.us,
  notes = excluded.notes,
  clues = excluded.clues,
  traps = excluded.traps;
`;

await writeFile(resolve(root, "supabase/seed.sql"), sql, "utf8");
console.log(`wrote supabase/seed.sql — ${items.length} items`);
