import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Button, Eyebrow, Field, Screen, Title } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { color, space } from "@/lib/theme";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email) return;
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "englishvariant://auth/callback" },
    });
    setPending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <Screen>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: space[6] }}>
          <Eyebrow>English / Variant</Eyebrow>
          <View style={{ height: space[4] }} />
          <Title>Sign in</Title>
          <View style={{ height: space[2] }} />
          <Body muted>We'll email you a one-time link. No password to remember.</Body>

          <View style={{ height: space[8] }} />

          {sent ? (
            <View
              style={{
                backgroundColor: color.surface,
                borderColor: color.border,
                borderWidth: 1,
                padding: space[4],
                borderRadius: 12,
              }}
            >
              <Body>Check your inbox.</Body>
              <View style={{ height: space[1] }} />
              <Body muted>We sent a sign-in link to {email}. It expires in an hour.</Body>
            </View>
          ) : (
            <>
              <Field
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {error && (
                <>
                  <View style={{ height: space[2] }} />
                  <Body muted>{error}</Body>
                </>
              )}
              <View style={{ height: space[4] }} />
              <Button
                title={pending ? "Sending…" : "Send magic link"}
                onPress={submit}
                disabled={pending || !email}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </Screen>
  );
}
