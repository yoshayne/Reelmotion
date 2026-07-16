import { useSSO, useAuth, useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

// maybeCompleteAuthSession() lives in app/sso-callback.tsx — not here.

const APP_URL = "https://reelmotionapp.com";

const CHROME_UA =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1";

// Injected before the page loads — tells the website it's running in the native app
// so Landing.tsx skips Clerk's web OAuth and messages us instead
const INJECTED_JS = `
  window.__NATIVE_APP__ = true;
  true;
`;

const ts = () => new Date().toISOString().slice(11, 23);

export default function App() {
  const { startSSOFlow } = useSSO();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const webViewRef = useRef<WebView>(null);
  const [logs, setLogs] = useState<string[]>([`${ts()} App mounted`]);
  const injectedRef = useRef(false);
  const ssoRunning = useRef(false);

  const addLog = (msg: string) => {
    const line = `${ts()} ${msg}`;
    console.log(`[RM] ${line}`);
    setLogs((prev) => [...prev.slice(-40), line]);
  };

  useEffect(() => {
    addLog(`Auth: isLoaded=${isLoaded} isSignedIn=${isSignedIn} userId=${user?.id ?? "none"}`);
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (isSignedIn && !injectedRef.current) {
      addLog("isSignedIn→true, calling injectSession");
      injectSession("auth-change");
    }
    if (!isSignedIn) {
      addLog("isSignedIn→false (signed out detected)");
      injectedRef.current = false;
    }
  }, [isSignedIn]);

  const injectSession = async (trigger: string) => {
    addLog(`injectSession START trigger=${trigger}`);
    try {
      addLog("Calling getToken()...");
      const token = await getToken();
      addLog(`getToken result: ${token ? "GOT TOKEN len=" + token.length : "NULL"}`);

      if (!token) {
        addLog("ERROR: no token — aborting inject");
        return;
      }
      if (!webViewRef.current) {
        addLog("ERROR: webViewRef is null");
        return;
      }

      const userInfo = {
        id: user?.id ?? "",
        email: user?.primaryEmailAddress?.emailAddress ?? "",
        firstName: user?.firstName ?? "",
        imageUrl: user?.imageUrl ?? "",
      };
      addLog(`Injecting user: ${userInfo.email} id=${userInfo.id}`);

      webViewRef.current.injectJavaScript(`
        (function() {
          window.__NATIVE_APP__ = true;
          window.__NATIVE_CLERK_TOKEN__ = ${JSON.stringify(token)};
          window.__NATIVE_USER__ = ${JSON.stringify(userInfo)};
          window.dispatchEvent(new CustomEvent('native-session-ready', { detail: { user: window.__NATIVE_USER__ } }));
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'INJECT_OK', email: window.__NATIVE_USER__.email }));
        })();
        true;
      `);

      injectedRef.current = true;
      addLog(`injectSession DONE for ${userInfo.email}`);
    } catch (e: any) {
      addLog(`injectSession ERROR: ${e?.message ?? e} code=${e?.code ?? "?"} status=${e?.status ?? "?"}`);
      addLog(`Full error: ${JSON.stringify(e)}`);
    }
  };

  const handleNativeSSO = async () => {
    if (ssoRunning.current) {
      addLog("SSO already running — ignoring duplicate call");
      return;
    }
    ssoRunning.current = true;
    addLog("handleNativeSSO START");

    try {
      const redirectUrl = Linking.createURL("/sso-callback");
      addLog(`redirectUrl: ${redirectUrl}`);
      addLog(`startSSOFlow exists: ${typeof startSSOFlow}`);

      addLog("Calling startSSOFlow...");
      const result = await startSSOFlow({ strategy: "oauth_google", redirectUrl });

      addLog(`startSSOFlow returned: createdSessionId=${result.createdSessionId ?? "NONE"}`);
      addLog(`setActive exists: ${typeof result.setActive}`);
      addLog(`authSessionResult: ${JSON.stringify(result.authSessionResult ?? {})}`);

      const { createdSessionId, setActive } = result;

      if (!createdSessionId) {
        addLog("ERROR: no createdSessionId — user may have cancelled");
        Alert.alert("Cancelled", "No session was created.");
        return;
      }
      if (!setActive) {
        addLog("ERROR: setActive is undefined");
        Alert.alert("Error", "setActive not available");
        return;
      }

      addLog(`Calling setActive with sessionId=${createdSessionId}`);
      await setActive({ session: createdSessionId });
      addLog("setActive DONE");

      injectedRef.current = false;
      addLog("Calling injectSession post-SSO");
      await injectSession("post-sso");

    } catch (e: any) {
      addLog(`handleNativeSSO ERROR: ${e?.message ?? e}`);
      addLog(`  code: ${e?.code ?? "none"}`);
      addLog(`  status: ${e?.status ?? "none"}`);
      addLog(`  errors: ${JSON.stringify(e?.errors ?? [])}`);
      addLog(`  full: ${JSON.stringify(e)}`);
      Alert.alert("Sign-in Error", `${e?.message ?? e}\n\ncode: ${e?.code ?? "?"}`);
    } finally {
      ssoRunning.current = false;
      addLog("handleNativeSSO END");
    }
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { targetUrl } = syntheticEvent.nativeEvent;
    addLog(`OpenWindow: ${targetUrl}`);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      addLog(`WebView→Native: ${JSON.stringify(data)}`);
      if (data.type === "GOOGLE_SIGN_IN") {
        addLog("Website requested native Google sign-in");
        handleNativeSSO();
      }
    } catch {
      addLog(`WebView→Native (raw): ${event.nativeEvent.data}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.debugPanel}>
        <ScrollView style={styles.logScroll} ref={(r) => r?.scrollToEnd()}>
          {logs.map((l, i) => (
            <Text key={i} style={styles.logLine}>{l}</Text>
          ))}
        </ScrollView>
      </View>
      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        userAgent={CHROME_UA}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        injectedJavaScript={INJECTED_JS}
        onOpenWindow={handleOpenWindow}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => {
          addLog("WebView onLoadEnd");
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
  debugPanel: {
    height: 160,
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingTop: 50,
  },
  logScroll: { flex: 1, paddingHorizontal: 8 },
  logLine: { color: "#0f0", fontSize: 9, fontFamily: "monospace", lineHeight: 13 },
  webview: { flex: 1, backgroundColor: "#000" },
  loader: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
