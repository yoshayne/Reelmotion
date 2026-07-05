import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";

const APP_URL = "https://reelmotion-production.up.railway.app";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (isSignedIn) router.replace("/(app)");
  }, [isSignedIn]);

  const handleNavigationChange = (nav: WebViewNavigation) => {
    // Once the web app signs the user in, Clerk state updates automatically
    // and the useEffect above redirects to the app
    if (nav.url.includes("/browse") || nav.url.includes("/home")) {
      router.replace("/(app)");
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${APP_URL}/` }}
        style={styles.webview}
        userAgent={CHROME_UA}
        onNavigationStateChange={handleNavigationChange}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
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
