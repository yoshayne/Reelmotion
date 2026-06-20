import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";

// Required for Google OAuth to complete in Custom Tabs / SFSafariViewController
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(app)");
      }
    } catch (err: any) {
      Alert.alert("Sign In Failed", err?.errors?.[0]?.message || "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, email, password]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive: setActiveOAuth } = await googleOAuth({
        redirectUrl: Linking.createURL("/(app)", { scheme: "reelmotion" }),
      });
      if (createdSessionId && setActiveOAuth) {
        await setActiveOAuth({ session: createdSessionId });
        router.replace("/(app)");
      }
    } catch (err: any) {
      Alert.alert("Google Sign In Failed", err?.errors?.[0]?.message || "Something went wrong.");
    }
  }, [googleOAuth]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>REELMOTION</Text>
        <Text style={styles.tagline}>Stream. Watch. Discover.</Text>

        {/* Google Sign In — opens in Custom Tabs (Android) / SFSafariViewController (iOS) */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  logo: {
    color: "#E8001D",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 6,
  },
  tagline: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 48,
  },
  googleBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  googleBtnText: { color: "#000", fontWeight: "600", fontSize: 15 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#222" },
  dividerText: { color: "#555", marginHorizontal: 12, fontSize: 13 },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
  },
  signInBtn: {
    backgroundColor: "#E8001D",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  signInBtnDisabled: { opacity: 0.6 },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
