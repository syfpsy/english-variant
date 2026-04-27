import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { analyze, rewrite, type Variant } from "@english-variant/shared";
import { Body, DialectChip, Eyebrow, Field, Screen, Title } from "@/components/ui";
import { color, radius, space, typography } from "@/lib/theme";

const SAMPLE = `I travelled last autumn and organised a flat near the centre. My neighbour parks on the pavement. We favor a consistent tone.`;

export default function CheckerScreen() {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<Variant>("uk");

  const result = useMemo(() => analyze(input), [input]);
  const rewritten = useMemo(() => rewrite(input, active), [input, active]);

  return (
    <Screen>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space[6] }}>
          <Eyebrow>Checker</Eyebrow>
          <View style={{ height: space[2] }} />
          <Title>Paste. See. Rewrite.</Title>
          <View style={{ height: space[5] }} />

          <Field
            placeholder="Paste any text here…"
            value={input}
            onChangeText={setInput}
            multiline
            numberOfLines={6}
            style={{ minHeight: 140, textAlignVertical: "top" }}
          />
          <View style={{ height: space[2] }} />
          <Pressable onPress={() => setInput(SAMPLE)}>
            <Body muted>Try a sample →</Body>
          </Pressable>

          <View style={{ height: space[5] }} />

          {/* Verdict */}
          <View
            style={{
              backgroundColor: color.surface,
              borderColor: color.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: space[4],
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Eyebrow>Verdict</Eyebrow>
              {result.verdict && <DialectChip variant={result.verdict} />}
            </View>
            <View style={{ height: space[2] }} />
            <Body>{result.summary}</Body>
            {result.findings.length > 0 && (
              <>
                <View style={{ height: space[3] }} />
                <View style={{ flexDirection: "row", gap: space[2] }}>
                  <Body muted>UK: {result.ukCount}</Body>
                  <Body muted>·</Body>
                  <Body muted>US: {result.usCount}</Body>
                </View>
              </>
            )}
          </View>

          {result.findings.length > 0 && (
            <>
              <View style={{ height: space[4] }} />
              <View
                style={{
                  backgroundColor: color.surface,
                  borderColor: color.border,
                  borderWidth: 1,
                  borderRadius: radius.lg,
                  padding: space[4],
                }}
              >
                <Eyebrow>Clues</Eyebrow>
                <View style={{ height: space[2] }} />
                {dedupe(result.findings.map((f) => f.clue)).map((c, i) => (
                  <Body key={i}>· {c}</Body>
                ))}
              </View>
            </>
          )}

          {input.trim().length > 0 && (
            <>
              <View style={{ height: space[4] }} />
              <View
                style={{
                  backgroundColor: color.surface,
                  borderColor: color.border,
                  borderWidth: 1,
                  borderRadius: radius.lg,
                  padding: space[4],
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Eyebrow>Consistent rewrite</Eyebrow>
                  <View
                    style={{
                      flexDirection: "row",
                      borderColor: color.border,
                      borderWidth: 1,
                      borderRadius: radius.md,
                      padding: 2,
                    }}
                  >
                    {(["uk", "us"] as const).map((v) => (
                      <Pressable
                        key={v}
                        onPress={() => setActive(v)}
                        style={{
                          paddingHorizontal: space[3],
                          paddingVertical: space[1],
                          borderRadius: radius.sm,
                          backgroundColor:
                            active === v
                              ? v === "uk"
                                ? color.ukSoft
                                : color.usSoft
                              : "transparent",
                        }}
                      >
                        <Body
                          muted={active !== v}
                        >
                          {v === "uk" ? "British" : "American"}
                        </Body>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={{ height: space[3] }} />
                <Body>{rewritten.text}</Body>

                {rewritten.changes.length > 0 && (
                  <>
                    <View style={{ height: space[3], borderBottomColor: color.border, borderBottomWidth: 1 }} />
                    <View style={{ height: space[3] }} />
                    <Eyebrow>
                      {rewritten.changes.length} change{rewritten.changes.length === 1 ? "" : "s"}
                    </Eyebrow>
                    <View style={{ height: space[2] }} />
                    {rewritten.changes.map((c, i) => (
                      <View key={i} style={{ flexDirection: "row", marginBottom: space[1] }}>
                        <Body muted>{c.from}</Body>
                        <View style={{ width: space[2] }} />
                        <Body>→</Body>
                        <View style={{ width: space[2] }} />
                        <Body>{c.to}</Body>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function dedupe(xs: string[]): string[] {
  return Array.from(new Set(xs));
}
