import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Card, DialectChip, Eyebrow, Screen, Title } from "@/components/ui";
import { CONTENT_COUNT, dailyPick } from "@english-variant/content";
import type { ContentItem, Variant } from "@english-variant/shared";
import { supabase } from "@/lib/supabase";
import { color, space } from "@/lib/theme";

export default function HomeScreen() {
  const [target, setTarget] = useState<Variant>("uk");
  const [progress, setProgress] = useState<{ streak: number; accuracy: number | null }>({
    streak: 0,
    accuracy: null,
  });
  const daily: ContentItem = dailyPick();

  useEffect(() => {
    (async () => {
      const [{ data: prefs }, { data: ps }] = await Promise.all([
        supabase.from("user_preferences").select("target_variant").single(),
        supabase.from("progress_summary").select("total_attempts, correct_attempts, streak_days").maybeSingle(),
      ]);
      if (prefs) setTarget(prefs.target_variant);
      if (ps) {
        setProgress({
          streak: ps.streak_days,
          accuracy:
            ps.total_attempts > 0
              ? Math.round((ps.correct_attempts / ps.total_attempts) * 100)
              : null,
        });
      }
    })();
  }, []);

  const example = target === "uk" ? daily.uk : daily.us;

  return (
    <Screen>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space[6] }}>
          <Eyebrow>Today</Eyebrow>
          <View style={{ height: space[2] }} />
          <Title>One contrast a day.</Title>

          <View style={{ height: space[6] }} />

          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <DialectChip variant={target} label={`Target ${target.toUpperCase()}`} />
              <Eyebrow>{daily.category}</Eyebrow>
            </View>
            <View style={{ height: space[3] }} />
            <Body>"{example.sentence}"</Body>
            <View style={{ height: space[4] }} />
            <View style={{ flexDirection: "row", gap: space[2] }}>
              <DialectChip variant="uk" label={`UK ${daily.uk.term}`} />
              <DialectChip variant="us" label={`US ${daily.us.term}`} />
            </View>
            {daily.clues[0] && (
              <>
                <View style={{ height: space[3] }} />
                <Body muted>{daily.clues[0]}</Body>
              </>
            )}
          </Card>

          <View style={{ height: space[6] }} />

          <View style={{ flexDirection: "row", gap: space[3] }}>
            <Stat label="Streak" value={String(progress.streak)} unit={progress.streak === 1 ? "day" : "days"} />
            <Stat label="Accuracy" value={progress.accuracy === null ? "—" : String(progress.accuracy)} unit={progress.accuracy !== null ? "%" : ""} />
            <Stat label="Library" value={String(CONTENT_COUNT)} unit="items" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.surface,
        borderColor: color.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: space[4],
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <View style={{ height: space[2] }} />
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Body>{value}</Body>
        {unit !== "" && (
          <>
            <View style={{ width: 4 }} />
            <Body muted>{unit}</Body>
          </>
        )}
      </View>
    </View>
  );
}
