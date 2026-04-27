import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { color, radius, space, typography } from "@/lib/theme";
import type { Variant } from "@english-variant/shared";

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flex: 1, backgroundColor: color.bg }, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: color.inkSubtle,
        fontSize: typography.size.xs,
        letterSpacing: 2,
        textTransform: "uppercase",
        fontWeight: "500",
      }}
    >
      {children}
    </Text>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: color.ink,
        fontSize: typography.size["2xl"],
        fontWeight: "600",
        letterSpacing: -0.5,
        lineHeight: typography.size["2xl"] * typography.leading.tight,
      }}
    >
      {children}
    </Text>
  );
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <Text
      style={{
        color: muted ? color.inkMuted : color.ink,
        fontSize: typography.size.base,
        lineHeight: typography.size.base * typography.leading.relaxed,
      }}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[cardStyles.base, style]}>{children}</View>;
}

export function Button({
  onPress,
  title,
  variant = "primary",
  disabled,
}: {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  const bg =
    variant === "primary"
      ? disabled
        ? color.inkSubtle
        : color.accent
      : variant === "secondary"
        ? color.surface
        : "transparent";
  const borderCol = variant === "secondary" ? color.border : "transparent";
  const textCol = variant === "primary" ? color.inkInverse : color.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderColor: borderCol,
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: space[5],
          paddingVertical: space[3],
          borderRadius: radius.md,
          opacity: pressed ? 0.9 : 1,
          alignItems: "center",
        },
      ]}
    >
      <Text style={{ color: textCol, fontSize: typography.size.base, fontWeight: "500" }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string; error?: string }) {
  const { label, error, style, ...rest } = props;
  return (
    <View>
      {label && (
        <Text
          style={{
            color: color.inkMuted,
            fontSize: typography.size.sm,
            marginBottom: space[2],
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={color.inkSubtle}
        style={[
          {
            backgroundColor: color.surface,
            borderColor: error ? color.danger : color.border,
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: space[4],
            paddingVertical: space[3],
            fontSize: typography.size.base,
            color: color.ink,
          },
          style,
        ]}
        {...rest}
      />
      {error && (
        <Text style={{ color: color.danger, fontSize: typography.size.xs, marginTop: space[1] }}>
          {error}
        </Text>
      )}
    </View>
  );
}

export function DialectChip({
  variant,
  label,
}: {
  variant: Variant | "mixed";
  label?: string;
}) {
  const bg =
    variant === "uk"
      ? color.ukSoft
      : variant === "us"
        ? color.usSoft
        : color.warningSoft;
  const fg =
    variant === "uk" ? color.uk : variant === "us" ? color.us : color.warning;

  const text = label ?? (variant === "mixed" ? "Mixed" : variant.toUpperCase());

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: space[2],
        paddingVertical: 3,
        borderRadius: radius.pill,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {text}
      </Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: color.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.border,
    padding: space[5],
  },
});
