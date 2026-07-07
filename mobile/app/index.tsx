import { useSSO, useAuth, useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

WebBrowser.maybeCompleteAuthSession();

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

const log = (msg: string) => {
  console.log(`[ReelMotion] ${msg}`);
};

export default function App() {
  const { startSSOFlow } = useSSO();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const webViewRef = useRef<WebView>(null);
  const [statusMsg, setStatusMsg] = useState("Loading...");
  const injectedRef = useRef(false);

  log(`Render: isLoaded=${isLoaded} isSignedIn=${isSignedIn} user=${user?.id ?? "none"}`);

  useEffect(() => {
    log(`Auth state changed: isSignedIn=${isSignedIn}`);
    if (isSignedIn && !injectedRef.current) {
      injectSession("auth-state-change");
    }
  }, [isSignedIn]);

  const injectSession = async (trigger: string) => {
    try {
      log(`injectSession called from: ${trigger}`);
      setStatusMsg(`Injecting session (${trigger})...`);

      const token = await getToken();
      log(`Token obtained: ${token ? "YES (" + token.slice(0, 20) + "...)" : "NO"}`);

      if (!token) {
        log("No token available — skipping injection");
        setStatusMsg("No token");
        return;
      }
      if (!webViewRef.current) {
        log("WebView ref not ready — skipping injection");
        setStatusMsg("WebView not ready");
        return;
      }

      const userInfo = {
        id: user?.id ?? "",
        email: user?.primaryEmailAddress?.emailAddress ?? "",
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        imageUrl: user?.imageUrl ?? "",
      };

      log(`Injecting user: ${JSON.stringify(userInfo)}`);

      webViewRef.current.injectJavaScript(`
        (function() {
          console.log('[Native] Injecting session...');
          window.__NATIVE_APP__ = true;
          window.__NATIVE_CLERK_TOKEN__ = ${JSON.stringify(token)};
          window.__NATIVE_USER__ = ${JSON.stringify(userInfo)};
          window.dispatchEvent(new CustomEvent('native-session-ready', { detail: { user: window.__NATIVE_USER__ } }));
          console.log('[Native] Session injected for: ' + window.__NATIVE_USER__.email);
        })();
        true;
      `);

      injectedRef.current = true;
      setStatusMsg(`Signed in: ${userInfo.email}`);
      log(`Session injected for ${userInfo.email}`);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      log(`injectSession ERROR: ${msg}`);
      setStatusMsg(`Injection error: ${msg}`);
      Alert.alert("Session Error", msg);
    }
  };

  const handleNativeSSO = async () => {
    log("handleNativeSSO called");
    setStatusMsg("Starting Google sign-in...");
    try {
      const redirectUrl = Linking.createURL("");
      log(`SSO redirectUrl: ${redirectUrl}`);

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      log(`SSO result: createdSessionId=${result.createdSessionId ?? "none"}`);

      const { createdSessionId, setActive } = result;
      if (createdSessionId && setActive) {
        log("Setting active session...");
        await setActive({ session: createdSessionId });
        log("Session set active — injecting into WebView");
        injectedRef.current = false; // allow re-injection
        await injectSession("post-sso");
      } else {
        log("No createdSessionId returned from startSSOFlow");
        Alert.alert("Sign-in incomplete", "No session was created. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      log(`handleNativeSSO ERROR: ${msg}`);
      Alert.alert("Sign-in Error", msg);
      setStatusMsg(`Error: ${msg}`);
    }
  };

  const handleShouldStartLoad = (request: { url: string }) => {
    log(`Navigation: ${request.url}`);
    if (isOAuth(request.url)) {
      log(`OAuth intercepted: ${request.url}`);
      handleNativeSSO();
      return false;
    }
    return true;
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { targetUrl } = syntheticEvent.nativeEvent;
    log(`OpenWindow: ${targetUrl}`);
    if (targetUrl && isOAuth(targetUrl)) {
      handleNativeSSO();
    }
  };

  const handleWebViewMessage = (event: any) => {
    log(`WebView message: ${event.nativeEvent.data}`);
  };

  return (
    <View style={styles.container}>
      {/* Slim debug bar — remove after testing */}
      <View style={styles.debugBar}>
        <Text style={styles.debugText} numberOfLines={1}>{statusMsg}</Text>
      </View>
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
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onOpenWindow={handleOpenWindow}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => {
          log("WebView onLoadEnd");
          if (isSignedIn) injectSession("load-end");
        }}
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
  debugBar: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    paddingTop: 50,
  },
  debugText: { color: "#888", fontSize: 10, fontFamily: "monospace" },
  loader: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
