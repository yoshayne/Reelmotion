import { useRef } from "react";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

const APP_URL = "https://reelmotion-production.up.railway.app";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

export default function AppScreen() {
  const webViewRef = useRef<WebView>(null);
  const { signOut } = useAuth();
  const router = useRouter();

  const handleNavigationChange = (nav: WebViewNavigation) => {
    if (nav.url.includes("/sign-out") || nav.url.includes("__clerk_sign_out")) {
      signOut().then(() => router.replace("/(auth)/sign-in"));
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${APP_URL}/browse` }}
        style={styles.webview}
        userAgent={CHROME_UA}
        onNavigationStateChange={handleNavigationChange}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#E8001D" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
  loader: {
    position: "absolute",
    inset: 0,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
