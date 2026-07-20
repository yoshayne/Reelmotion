import { useUser } from "@clerk/clerk-react";
import { useNativeSession } from "./useNativeSession";

/**
 * Unified auth hook that works for both:
 * - Web users signed in via Clerk (user object populated)
 * - Mobile WebView users injected via window.__NATIVE_CLERK_TOKEN__ (nativeUser populated)
 *
 * Use this instead of useUser() on any page that needs to be accessible from
 * the native iOS/Android app or future TV apps.
 */
export function useEffectiveAuth() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { isNativeApp, nativeUser, isSignedIn: isNativeSignedIn } = useNativeSession();

  const isSignedIn = !!user || isNativeSignedIn;
  // If native token is already present, treat as loaded immediately
  const isLoaded = clerkLoaded || isNativeSignedIn;

  return {
    user,        // Clerk User object — null for native-only sessions
    nativeUser,  // Basic profile from window.__NATIVE_USER__ — null for web sessions
    isSignedIn,
    isLoaded,
    isNativeApp,
  };
}
