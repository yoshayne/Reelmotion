import { StyleSheet, View, ActivityIndicator, Platform, Linking } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useRef } from "react";

const APP_URL = "https://reelmotion-production.up.railway.app";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

// URLs that should open in Safari instead of the WebView
const EXTERNAL_PATTERNS = [
  "accounts.google.com",
  "clerk.reelmotionapp.com",
  "accounts.clerk.com",
];

export default function App() {
  const webViewRef = useRef<WebView>(null);

  const shouldOpenInSafari = (url: string) =>
    EXTERNAL_PATTERNS.some((p) => url.includes(p));

  const handleNavigationChange = (nav: WebViewNavigation) => {
    if (shouldOpenInSafari(nav.url)) {
      // Stop WebView loading this URL and open in Safari instead
      webViewRef.current?.stopLoading();
      Linking.openURL(nav.url);
    }
  };

  const handleShouldStartLoad = (request: { url: string }) => {
    if (shouldOpenInSafari(request.url)) {
      Linking.openURL(request.url);
      return false; // block the WebView from loading it
    }
    return true;
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
        setSupportMultipleWindows={true}
        onNavigationStateChange={handleNavigationChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
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
