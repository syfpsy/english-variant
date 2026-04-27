import type { Variant } from "@english-variant/shared";

export function DialectBadge({
  variant,
  label,
  size = "md",
}: {
  variant: Variant | "mixed";
  label?: string;
  size?: "sm" | "md";
}) {
  const cls =
    variant === "uk"
      ? "chip-uk"
      : variant === "us"
        ? "chip-us"
        : "bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)] border border-[color-mix(in_srgb,var(--color-warning)_25%,transparent)]";
  const display = label ?? (variant === "mixed" ? "Mixed" : variant.toUpperCase());
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium tracking-wide uppercase ${cls} ${padding}`}
    >
      {display}
    </span>
  );
}
