import { StyleSheet, View, ActivityIndicator, Platform, Linking } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useRef } from "react";

const APP_URL = "https://reelmotion-production.up.railway.app";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

// URLs that must open in the system browser (Safari/Chrome) not the WebView
const EXTERNAL_PATTERNS = [
  "accounts.google.com",
  "clerk.reelmotionapp.com",
  "accounts.clerk.com",
];

const isExternal = (url: string) =>
  EXTERNAL_PATTERNS.some((p) => url.includes(p));

export default function App() {
  const webViewRef = useRef<WebView>(null);

  // iOS: intercept top-level navigations before they load
  const handleShouldStartLoad = (request: { url: string }) => {
    if (isExternal(request.url)) {
      Linking.openURL(request.url);
      return false;
    }
    return true;
  };

  // Both: catch navigations that already started
  const handleNavigationChange = (nav: WebViewNavigation) => {
    if (isExternal(nav.url)) {
      webViewRef.current?.stopLoading();
      Linking.openURL(nav.url);
    }
  };

  // Android: catch popup/new-window requests (Google OAuth opens this way)
  const handleOpenWindow = (syntheticEvent: any) => {
    const { targetUrl } = syntheticEvent.nativeEvent;
    if (targetUrl) {
      Linking.openURL(targetUrl);
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
        setSupportMultipleWindows={true}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onNavigationStateChange={handleNavigationChange}
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
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
