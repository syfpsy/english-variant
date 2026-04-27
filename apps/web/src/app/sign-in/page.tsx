"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Button, Input } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/client";

const DEMO_EMAIL = "demo@englishvariant.app";
const DEMO_PASSWORD = "demo-playground-2026";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [demoPending, setDemoPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await getBrowserSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    setPending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInAsDemo() {
    setError(null);
    setDemoPending(true);
    const { error } = await getBrowserSupabase().auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    setDemoPending(false);
    if (error) setError(error.message);
    else router.replace("/home");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-16">
      <div className="mb-10">
        <Link href="/">
          <Brand />
        </Link>
      </div>

      <h1
        className="text-2xl font-semibold tracking-tight text-ink"
        style={{ letterSpacing: "-0.02em" }}
      >
        Sign in
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        We'll email you a one-time link. No password to remember.
      </p>

      {sent ? (
        <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm text-ink">
          <div className="font-medium">Check your inbox.</div>
          <div className="mt-1 text-ink-muted">
            We sent a sign-in link to{" "}
            <span className="font-medium text-ink">{email}</span>. It expires in
            an hour.
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            size="lg"
            autoFocus
          />
          {error && (
            <div className="rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}
          <Button
            type="submit"
            isLoading={pending}
            fullWidth
            size="lg"
          >
            Send magic link
          </Button>
        </form>
      )}

      {!sent && (
        <div className="mt-8">
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
              <span className="bg-bg px-2">or</span>
            </div>
          </div>
          <button
            type="button"
            onClick={signInAsDemo}
            disabled={demoPending}
            className="mt-4 w-full rounded-lg border border-border bg-surface px-4 py-3 text-[15px] text-ink transition hover:border-border-strong disabled:opacity-60"
          >
            {demoPending ? "Signing in…" : "Try the demo account"}
          </button>
          <p className="mt-2 text-center text-[12px] text-ink-subtle">
            Instant access, no email required. Shared demo data.
          </p>
        </div>
      )}

      <p className="mt-8 text-xs text-ink-subtle">
        By continuing, you agree to be a grown-up about your data.
      </p>
    </main>
  );
}
