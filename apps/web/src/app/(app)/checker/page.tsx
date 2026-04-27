import { getServerSupabase } from "@/lib/supabase/server";
import { CheckerConsole } from "./CheckerConsole";

export default async function CheckerPage() {
  const supabase = await getServerSupabase();
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("target_variant")
    .single();

  return <CheckerConsole target={prefs!.target_variant} />;
}
