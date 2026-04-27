import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { color } from "@/lib/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const user = data.session?.user;
      setSignedIn(!!user);
      if (user) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("user_id")
          .maybeSingle();
        setNeedsOnboarding(!prefs);
      }
      setReady(true);
    }
    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inApp = segments[0] === "(app)";
    const onAuth = segments[0] === "sign-in";
    const onOnboarding = segments[0] === "onboarding";

    if (!signedIn && !onAuth) {
      router.replace("/sign-in");
    } else if (signedIn && needsOnboarding && !onOnboarding) {
      router.replace("/onboarding");
    } else if (signedIn && !needsOnboarding && (onAuth || !segments[0])) {
      router.replace("/(app)/home");
    }
  }, [ready, signedIn, needsOnboarding, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }} />
    </SafeAreaProvider>
  );
}
