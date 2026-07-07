import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const APP_URL = "https://reelmotionapp.com";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

export default function AppScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const webViewRef = useRef<WebView>(null);
  const [injected, setInjected] = useState(false);

  const injectSession = async () => {
    if (injected) return;
    try {
      const token = await getToken();
      if (!token || !webViewRef.current) return;

      const userInfo = {
        id: user?.id ?? "",
        email: user?.primaryEmailAddress?.emailAddress ?? "",
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        imageUrl: user?.imageUrl ?? "",
      };

      webViewRef.current.injectJavaScript(`
        (function() {
          window.__NATIVE_APP__ = true;
          window.__NATIVE_CLERK_TOKEN__ = ${JSON.stringify(token)};
          window.__NATIVE_USER__ = ${JSON.stringify(userInfo)};
          window.dispatchEvent(new CustomEvent('native-session-ready', { detail: { user: window.__NATIVE_USER__ } }));
        })();
        true;
      `);
      setInjected(true);
    } catch (e) {
      console.error("Session injection failed:", e);
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
        sharedCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        onLoadEnd={injectSession}
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
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
