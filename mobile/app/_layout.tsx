import { ClerkProvider } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { tokenCache } from "../lib/tokenCache";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

// Known Clerk SecureStore keys that can go stale between test builds
const CLERK_SECURE_STORE_KEYS = [
  "clerk-client",
  "__clerk_client_jwt",
  "clerk-db-jwt",
  "clerk-session",
];

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const clearStaleClerkData = async () => {
      await Promise.all(
        CLERK_SECURE_STORE_KEYS.map((k) => SecureStore.deleteItemAsync(k).catch(() => {}))
      );
      setReady(true);
    };
    clearStaleClerkData();
  }, []);

  if (!ready) return null;

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <StatusBar style="light" backgroundColor="#000000" />
      <Slot />
    </ClerkProvider>
  );
}
