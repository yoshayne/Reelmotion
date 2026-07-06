import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // warmUpAsync is Android-only; safe to call on iOS (no-op)
    if (Platform.OS === "android") {
      WebBrowser.warmUpAsync().catch(() => {});
    }
    return () => {
      if (Platform.OS === "android") {
        WebBrowser.coolDownAsync().catch(() => {});
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    // Immediate test — if this Alert doesn't appear, the button isn't receiving taps
    Alert.alert("Button tapped", `startSSOFlow: ${typeof startSSOFlow}`);
    setLoading(true);
    setError(null);
    try {
      if (!startSSOFlow) {
        throw new Error("useSSO hook not available — check @clerk/clerk-expo version");
      }

      const redirectUrl = Linking.createURL("/");
      console.log("SSO redirect URL:", redirectUrl);

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      console.log("SSO result:", JSON.stringify(result));

      const { createdSessionId, setActive } = result;
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else {
        throw new Error("No session created — check Clerk allowlist for: " + redirectUrl);
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error("Google sign-in error:", msg);
      setError(msg);
      Alert.alert("Sign-in Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>REELMOTION</Text>
        <Text style={styles.subtitle}>Stream exclusive films & series</Text>

        <Pressable
          style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]}
          onPress={signInWithGoogle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.googleBtnText}>Sign in with Google</Text>
          )}
        </Pressable>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: "80%",
    alignItems: "center",
    gap: 20,
  },
  title: {
    color: "#E8001D",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 40,
    textAlign: "center",
  },
  googleBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
  googleBtnPressed: {
    opacity: 0.7,
  },
  googleBtnText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
