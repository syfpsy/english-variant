"use client";

/**
 * Slot for future global providers (theme, analytics, etc.).
 * HeroUI v3 doesn't require a provider — it's built on React Aria primitives
 * that work without global context.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
