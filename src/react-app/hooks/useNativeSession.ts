import { useEffect, useState } from "react";

interface NativeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

declare global {
  interface Window {
    __NATIVE_APP__?: boolean;
    __NATIVE_CLERK_TOKEN__?: string;
    __NATIVE_USER__?: NativeUser;
  }
}

export function useNativeSession() {
  const [nativeUser, setNativeUser] = useState<NativeUser | null>(
    window.__NATIVE_USER__ ?? null
  );
  const isNativeApp = !!window.__NATIVE_APP__;

  useEffect(() => {
    if (window.__NATIVE_USER__) {
      setNativeUser(window.__NATIVE_USER__);
      return;
    }
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.user) setNativeUser(detail.user);
    };
    window.addEventListener("native-session-ready", handler);
    return () => window.removeEventListener("native-session-ready", handler);
  }, []);

  return { isNativeApp, nativeUser, isSignedIn: !!nativeUser };
}
