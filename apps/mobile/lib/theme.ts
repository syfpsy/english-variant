/**
 * Mobile theme derived from shared tokens.
 * Mirrors the web CSS variables so both apps look and feel identical.
 */

import { tokens } from "@english-variant/shared";

export const theme = tokens;
export const { color, space, radius, typography } = tokens;

export const styles = {
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.border,
    padding: space[5],
  },
  textBody: {
    color: color.ink,
    fontSize: typography.size.base,
    lineHeight: typography.size.base * typography.leading.relaxed,
  },
  textMuted: {
    color: color.inkMuted,
    fontSize: typography.size.sm,
  },
  textEyebrow: {
    color: color.inkSubtle,
    fontSize: typography.size.xs,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    fontWeight: "500" as const,
  },
};
