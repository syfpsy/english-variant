import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Button, DialectChip, Eyebrow, Screen, Title } from "@/components/ui";
import { SEED_CONTENT } from "@english-variant/content";
import {
  buildChooseTargetExercise,
  buildSpotExercise,
  grade,
  type Exercise,
  type Variant,
} from "@english-variant/shared";
import { supabase } from "@/lib/supabase";
import { color, radius, space } from "@/lib/theme";

const SESSION_LENGTH = 6;

export default function PracticeScreen() {
  const [target, setTarget] = useState<Variant>("uk");
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("user_preferences").select("target_variant").single();
      if (data) setTarget(data.target_variant);
    })();
  }, []);

  const session = useMemo(() => buildSession(target), [target, seed]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);

  if (index >= session.length) {
    return (
      <Screen>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: space[6], justifyContent: "center" }}>
            <Eyebrow>Session complete</Eyebrow>
            <View style={{ height: space[2] }} />
            <Title>
              {correct} of {session.length}
            </Title>
            <View style={{ height: space[2] }} />
            <Body muted>Missed items were added to Review.</Body>
            <View style={{ height: space[6] }} />
            <Button
              title="Run another set"
              onPress={() => {
                setIndex(0);
                setPicked(null);
                setRevealed(false);
                setCorrect(0);
                setSeed((s) => s + 1);
              }}
            />
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  const ex = session[index]!;
  const expected = "answer" in ex ? (ex.answer as string) : "";
  const options = getOptions(ex);

  async function onPick(value: string) {
    if (revealed) return;
    setPicked(value);
    setRevealed(true);
    const r = grade(expected, value);
    if (r.correct) setCorrect((c) => c + 1);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("attempts").insert({
      user_id: data.user.id,
      content_id: "contentId" in ex ? ex.contentId : null,
      exercise_kind: ex.kind,
      correct: r.correct,
      answer: value,
      expected,
    });
  }

  return (
    <Screen>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space[6] }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Eyebrow>{index + 1} / {session.length}</Eyebrow>
            <Eyebrow>{ex.kind.replace(/_/g, " ")}</Eyebrow>
          </View>
          <View style={{ height: space[3] }} />
          <Title>{ex.prompt}</Title>
          {"sentence" in ex && (
            <>
              <View style={{ height: space[3] }} />
              <Body>"{ex.sentence}"</Body>
            </>
          )}

          <View style={{ height: space[6] }} />

          {options.map((opt) => {
            const isPicked = picked === opt.value;
            const isCorrect = opt.value === expected;
            const bg =
              !revealed
                ? color.surface
                : isCorrect
                  ? color.successSoft
                  : isPicked
                    ? color.dangerSoft
                    : color.surface;
            const border =
              !revealed
                ? color.border
                : isCorrect
                  ? color.success
                  : isPicked
                    ? color.danger
                    : color.border;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onPick(opt.value)}
                style={{
                  backgroundColor: bg,
                  borderColor: border,
                  borderWidth: 1,
                  borderRadius: radius.lg,
                  padding: space[4],
                  marginBottom: space[3],
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Body>{opt.label}</Body>
                  {opt.badge && <DialectChip variant={opt.badge} />}
                </View>
              </Pressable>
            );
          })}

          {revealed && (
            <View
              style={{
                backgroundColor: color.surface,
                borderColor: color.border,
                borderWidth: 1,
                borderRadius: radius.lg,
                padding: space[4],
                marginTop: space[3],
              }}
            >
              <Eyebrow>{grade(expected, picked ?? "").correct ? "Correct" : "Not quite"}</Eyebrow>
              <View style={{ height: space[2] }} />
              {ex.clues.map((c, i) => (
                <Body key={i}>{c}</Body>
              ))}
            </View>
          )}

          <View style={{ height: space[6] }} />

          <Button
            title={index + 1 === session.length ? "Finish" : "Next"}
            onPress={() => {
              setIndex((i) => i + 1);
              setPicked(null);
              setRevealed(false);
            }}
            disabled={!revealed}
          />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function buildSession(target: Variant): Exercise[] {
  const shuffled = [...SEED_CONTENT].sort(() => Math.random() - 0.5).slice(0, SESSION_LENGTH);
  return shuffled.map((item, i) =>
    i % 2 === 0
      ? buildSpotExercise(item, Math.random() > 0.5 ? "uk" : "us")
      : buildChooseTargetExercise(item, target),
  );
}

function getOptions(ex: Exercise): Array<{ value: string; label: string; badge?: Variant }> {
  switch (ex.kind) {
    case "spot_the_dialect":
    case "listen_and_identify":
      return [
        { value: "uk", label: "British", badge: "uk" },
        { value: "us", label: "American", badge: "us" },
      ];
    case "choose_target":
      return ex.options.map((o, i) => ({
        value: o,
        label: o,
        badge: i === 0 ? "uk" : "us",
      }));
    case "make_consistent":
      return [];
  }
}
