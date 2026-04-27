export function Brand({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[17px] font-semibold tracking-tight text-ink ${className}`}
      style={{ letterSpacing: "-0.02em" }}
    >
      English
      <span className="text-accent"> / </span>
      Variant
    </span>
  );
}
