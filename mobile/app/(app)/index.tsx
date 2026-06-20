import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRef, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

const APP_URL = "https://reelmotion-production.up.railway.app";

// Chrome user-agent so Google OAuth is never blocked by "disallowed_useragent"
const CHROME_UA_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const CHROME_UA_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

import { Platform } from "react-native";
const USER_AGENT = Platform.OS === "android" ? CHROME_UA_ANDROID : CHROME_UA_IOS;

export default function AppScreen() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();

  // Inject the Clerk session token into the WebView so the web app
  // recognises the user as already signed in
  const injectAuth = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !webViewRef.current) return;
      const js = `
        (function() {
          window.__NATIVE_APP__ = true;
          window.__CLERK_TOKEN__ = ${JSON.stringify(token)};
          // Dispatch so the React app can pick it up if needed
          window.dispatchEvent(new CustomEvent('nativeToken', { detail: ${JSON.stringify(token)} }));
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    } catch {}
  }, [getToken]);

  const handleNavigationChange = useCallback(
    (nav: WebViewNavigation) => {
      // If the web app redirects to /sign-out, sign out natively too
      if (nav.url.includes("/sign-out") || nav.url.includes("__clerk_sign_out")) {
        signOut().then(() => router.replace("/(auth)/sign-in"));
      }
    },
    [signOut, router]
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${APP_URL}/browse` }}
        style={styles.webview}
        userAgent={USER_AGENT}
        onLoad={injectAuth}
        onNavigationStateChange={handleNavigationChange}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        // Prevent the WebView from opening external URLs inside itself
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
