import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Screen, Title } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { color, radius, space, typography } from "@/lib/theme";
import type { ReasonTag, Variant } from "@english-variant/shared";

const REASONS: Array<{ id: ReasonTag; label: string }> = [
  { id: "travel", label: "Travel" },
  { id: "work", label: "Work" },
  { id: "study", label: "Study" },
  { id: "general_fluency", label: "General fluency" },
];

export default function Onboarding() {
  const router = useRouter();
  const [variant, setVariant] = useState<Variant | null>(null);
  const [reasons, setReasons] = useState<Set<ReasonTag>>(new Set());
  const [pending, setPending] = useState(false);

  function toggle(r: ReasonTag) {
    const next = new Set(reasons);
    next.has(r) ? next.delete(r) : next.add(r);
    setReasons(next);
  }

  async function save() {
    if (!variant) return;
    setPending(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("user_preferences").upsert({
      user_id: data.user.id,
      target_variant: variant,
      reason_tags: Array.from(reasons),
    });
    setPending(false);
    router.replace("/(app)/home");
  }

  return (
    <Screen>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space[6] }}>
          <Eyebrow>Step 1 of 1</Eyebrow>
          <View style={{ height: space[2] }} />
          <Title>Which English are you aiming for?</Title>
          <View style={{ height: space[2] }} />
          <Body muted>We'll train you toward this variant and nudge inconsistencies along the way.</Body>

          <View style={{ height: space[6] }} />

          <View style={{ flexDirection: "row", gap: space[3] }}>
            {(
              [
                { id: "uk" as const, title: "British", desc: "Colour, centre, holiday." },
                { id: "us" as const, title: "American", desc: "Color, center, vacation." },
              ]
            ).map((v) => {
              const selected = variant === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => setVariant(v.id)}
                  style={{
                    flex: 1,
                    backgroundColor: color.surface,
                    borderColor: selected ? color.accent : color.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: radius.xl,
                    padding: space[4],
                  }}
                >
                  <Body muted>{v.id === "uk" ? "UK" : "US"}</Body>
                  <View style={{ height: space[2] }} />
                  <Body>{v.title}</Body>
                  <View style={{ height: space[1] }} />
                  <Body muted>{v.desc}</Body>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: space[8] }} />

          <Body>Why are you learning?</Body>
          <View style={{ height: space[1] }} />
          <Body muted>Optional, pick any that apply.</Body>
          <View style={{ height: space[3] }} />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
            {REASONS.map((r) => {
              const selected = reasons.has(r.id);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => toggle(r.id)}
                  style={{
                    paddingHorizontal: space[4],
                    paddingVertical: space[2],
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: selected ? color.accent : color.border,
                    backgroundColor: selected ? color.accentSoft : color.surface,
                  }}
                >
                  <Body>{r.label}</Body>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: space[10] }} />

          <Button
            title={pending ? "Saving…" : "Continue"}
            onPress={save}
            disabled={!variant || pending}
          />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}
