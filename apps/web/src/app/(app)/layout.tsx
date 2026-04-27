import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("target_variant")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prefs) redirect("/onboarding");

  return <Shell>{children}</Shell>;
}
