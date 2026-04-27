import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Card, DialectChip, Eyebrow, Screen, Title } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { byId } from "@english-variant/content";
import { color, space } from "@/lib/theme";
import type { ContentItem } from "@english-variant/shared";

type QueueRow = { content_id: string; miss_count: number; content: ContentItem };

export default function ReviewScreen() {
  const [queue, setQueue] = useState<QueueRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const { data } = await supabase
        .from("review_queue")
        .select("content_id, miss_count")
        .eq("user_id", user.user.id)
        .order("miss_count", { ascending: false });
      const hydrated = (data ?? [])
        .map((q) => ({ ...q, content: byId(q.content_id) }))
        .filter((q): q is QueueRow => !!q.content);
      setQueue(hydrated);
    })();
  }, []);

  return (
    <Screen>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space[6] }}>
          <Eyebrow>Review</Eyebrow>
          <View style={{ height: space[2] }} />
          <Title>Your missed contrasts.</Title>
          <View style={{ height: space[2] }} />
          <Body muted>Items stay here until you get them right twice.</Body>

          <View style={{ height: space[6] }} />

          {queue.length === 0 ? (
            <View
              style={{
                borderStyle: "dashed",
                borderColor: color.border,
                borderWidth: 1,
                borderRadius: 14,
                padding: space[5],
              }}
            >
              <Body muted>No items yet. Run a practice set — anything you miss lands here.</Body>
            </View>
          ) : (
            queue.map((q) => (
              <View key={q.content_id} style={{ marginBottom: space[3] }}>
                <Card>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Eyebrow>{q.content.category}</Eyebrow>
                    <Body muted>Missed ×{q.miss_count}</Body>
                  </View>
                  <View style={{ height: space[3] }} />
                  <View style={{ flexDirection: "row", gap: space[2], flexWrap: "wrap" }}>
                    <DialectChip variant="uk" label={`UK ${q.content.uk.term}`} />
                    <DialectChip variant="us" label={`US ${q.content.us.term}`} />
                  </View>
                  {q.content.clues[0] && (
                    <>
                      <View style={{ height: space[3] }} />
                      <Body muted>{q.content.clues[0]}</Body>
                    </>
                  )}
                </Card>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}
