import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startSSOFlow } = useSSO();

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => { WebBrowser.coolDownAsync(); };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = Linking.createURL("/");
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>REELMOTION</Text>
        <Text style={styles.subtitle}>Stream exclusive films & series</Text>

        <Pressable style={styles.googleBtn} onPress={signInWithGoogle}>
          <Text style={styles.googleBtnText}>Sign in with Google</Text>
        </Pressable>
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
  },
  googleBtnText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
});
