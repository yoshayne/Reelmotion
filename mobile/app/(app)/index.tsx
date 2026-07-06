import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const APP_URL = "https://reelmotion-production.up.railway.app";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

export default function AppScreen() {
  const { getToken, signOut } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [tokenInjected, setTokenInjected] = useState(false);

  const injectToken = async () => {
    if (tokenInjected) return;
    try {
      const token = await getToken();
      if (token && webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          (function() {
            window.__NATIVE_CLERK_TOKEN__ = ${JSON.stringify(token)};
            window.dispatchEvent(new Event('native-token-ready'));
          })();
          true;
        `);
        setTokenInjected(true);
      }
    } catch (err) {
      console.error("Token injection failed:", err);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        userAgent={CHROME_UA}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        onLoadEnd={injectToken}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
