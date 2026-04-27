import { getServerSupabase } from "@/lib/supabase/server";
import { SEED_CONTENT } from "@english-variant/content";
import { PracticeSession } from "./PracticeSession";

export default async function PracticePage() {
  const supabase = await getServerSupabase();
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("target_variant")
    .single();

  return (
    <PracticeSession
      target={prefs!.target_variant}
      items={SEED_CONTENT}
    />
  );
}
