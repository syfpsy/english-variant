import { Redirect } from "expo-router";

export default function Index() {
  // Root layout handles routing based on session state.
  return <Redirect href="/sign-in" />;
}
