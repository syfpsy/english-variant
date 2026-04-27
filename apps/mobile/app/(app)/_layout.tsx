import { Tabs } from "expo-router";
import { color, typography } from "@/lib/theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.border,
        },
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.inkMuted,
        tabBarLabelStyle: {
          fontSize: typography.size.xs,
          fontWeight: "500",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: () => null }} />
      <Tabs.Screen name="practice" options={{ title: "Practice", tabBarIcon: () => null }} />
      <Tabs.Screen name="checker" options={{ title: "Checker", tabBarIcon: () => null }} />
      <Tabs.Screen name="review" options={{ title: "Review", tabBarIcon: () => null }} />
    </Tabs>
  );
}
