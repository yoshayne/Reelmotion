import * as WebBrowser from "expo-web-browser";
import { useRef } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const APP_URL = "https://reelmotionapp.com";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

const OAUTH_PATTERNS = [
  "accounts.google.com",
  "clerk.reelmotionapp.com",
  "accounts.clerk.com",
];

const isOAuth = (url: string) => OAUTH_PATTERNS.some((p) => url.includes(p));

export default function App() {
  const webViewRef = useRef<WebView>(null);

  const openOAuth = async (url: string) => {
    // Opens in ASWebAuthenticationSession (iOS) / Chrome Custom Tab (Android)
    // which shares the same cookie store as WKWebView with sharedCookiesEnabled.
    // After auth completes, reload the WebView to pick up the Clerk session cookie.
    await WebBrowser.openAuthSessionAsync(url, APP_URL);
    webViewRef.current?.reload();
  };

  const handleShouldStartLoad = (request: { url: string }) => {
    if (isOAuth(request.url)) {
      openOAuth(request.url);
      return false;
    }
    return true;
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { targetUrl } = syntheticEvent.nativeEvent;
    if (targetUrl) {
      openOAuth(targetUrl);
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
        setSupportMultipleWindows={false}
        sharedCookiesEnabled={true}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onOpenWindow={handleOpenWindow}
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
