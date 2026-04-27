"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./Brand";
import { getBrowserSupabase } from "@/lib/supabase/client";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/home", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/checker", label: "Checker" },
  { href: "/review", label: "Review" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await getBrowserSupabase().auth.signOut();
    router.replace("/sign-in");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1080px] flex-col px-6 pb-16 pt-6 md:px-10">
      <header className="flex items-center justify-between border-b border-border/70 pb-4">
        <Link href="/home" className="-m-2 p-2">
          <Brand />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href as never}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                pathname?.startsWith(n.href)
                  ? "bg-accent-soft text-accent"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={signOut}
            className="ml-2 rounded-md px-3 py-1.5 text-sm text-ink-muted hover:text-ink"
          >
            Sign out
          </button>
        </nav>
      </header>
      <main className="mt-10 flex-1">{children}</main>
      <nav className="mt-8 flex justify-around border-t border-border/70 pt-3 md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href as never}
            className={`rounded-md px-3 py-2 text-[13px] ${
              pathname?.startsWith(n.href) ? "text-accent" : "text-ink-muted"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
