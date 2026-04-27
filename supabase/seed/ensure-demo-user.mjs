/**
 * Creates (or resets) the demo user used by the "Try the demo" button on
 * the sign-in page. Idempotent: safe to run multiple times.
 *
 * Usage:
 *   node supabase/seed/ensure-demo-user.mjs
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from env, falling back to
 * the well-known local-dev defaults so `supabase db reset && node ...` works
 * out of the box.
 */

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "REDACTED_LOCAL_DEV_KEY";

const DEMO_EMAIL = "demo@englishvariant.app";
const DEMO_PASSWORD = "demo-playground-2026";

async function api(path, init = {}) {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${body}`);
  }
  return body ? JSON.parse(body) : null;
}

// 1. Upsert the auth user. Look up by email; if it exists, update password
//    and set email_confirmed_at; otherwise create fresh.
async function ensureUser() {
  const list = await api(
    `/auth/v1/admin/users?filter=email.eq.${encodeURIComponent(DEMO_EMAIL)}`,
  );
  const existing = list?.users?.[0] ?? null;

  if (existing) {
    await api(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        password: DEMO_PASSWORD,
        email_confirm: true,
      }),
    });
    return existing.id;
  }

  const created = await api(`/auth/v1/admin/users`, {
    method: "POST",
    body: JSON.stringify({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Demo" },
    }),
  });
  return created.id;
}

// 2. Seed preferences so the demo lands in /home, not /onboarding.
async function ensurePreferences(userId) {
  await api(`/rest/v1/user_preferences?on_conflict=user_id`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: userId,
      target_variant: "uk",
      reason_tags: ["travel", "general_fluency"],
    }),
  });
}

async function main() {
  const id = await ensureUser();
  await ensurePreferences(id);
  console.log(`ok: demo user ${DEMO_EMAIL} (${id}) ready.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
