"use client";

import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Button as HeroButton } from "@heroui/react";

/**
 * Thin, token-driven primitives. HeroUI v3 is excellent but its form-field
 * model (TextField → Label + Input + Description) is more ceremony than we
 * need for an MVP. Native + Tailwind gets us there faster and keeps the bundle
 * lean. HeroUI's Button is used directly — its variant API fits.
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onPress?: () => void | Promise<void>;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  type = "button",
  variant = "primary",
  size = "md",
  isDisabled,
  isLoading,
  className = "",
  children,
  fullWidth,
}: ButtonProps) {
  // Map our UI semantics onto HeroUI v3's variant set where we can.
  const heroVariant =
    variant === "primary"
      ? "primary"
      : variant === "secondary"
        ? "secondary"
        : variant === "ghost"
          ? "ghost"
          : "danger";

  return (
    <HeroButton
      type={type}
      size={size}
      variant={heroVariant}
      isDisabled={isDisabled || isLoading}
      onPress={onPress}
      fullWidth={fullWidth}
      className={className}
    >
      {isLoading ? "…" : children}
    </HeroButton>
  );
}

/* ─── Input + Textarea ────────────────────────────────────────────────── */

interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "size"> {
  label?: string;
  error?: string | null;
  size?: "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, size = "md", className = "", id, ...rest },
  ref,
) {
  const reactId = useId();
  const auto = id ?? reactId;
  const h = size === "lg" ? "h-12" : "h-10";
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={auto}
          className="mb-1.5 block text-[13px] font-medium text-ink"
        >
          {label}
        </label>
      )}
      <input
        id={auto}
        ref={ref}
        className={`${h} w-full rounded-lg border ${error ? "border-[var(--color-danger)]" : "border-border"} bg-surface px-4 text-[15px] text-ink placeholder:text-ink-subtle outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  );
});

interface TextAreaProps extends ComponentPropsWithoutRef<"textarea"> {
  label?: string;
  minRows?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ label, minRows = 6, className = "", id, ...rest }, ref) {
    const reactId = useId();
    const auto = id ?? reactId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={auto}
            className="mb-1.5 block text-[13px] font-medium text-ink"
          >
            {label}
          </label>
        )}
        <textarea
          id={auto}
          ref={ref}
          rows={minRows}
          className={`w-full resize-y rounded-lg border border-border bg-surface p-4 text-[15px] leading-relaxed text-ink placeholder:text-ink-subtle outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft ${className}`}
          {...rest}
        />
      </div>
    );
  },
);
