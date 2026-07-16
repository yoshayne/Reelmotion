import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

// After web-based Google sign-in from the iOS app, Clerk redirects here.
// We redirect to the reelmotion:// deep link so the native app knows sign-in
// is done and can reload the WebView to pick up the Clerk session cookie.
export default function NativeSigninComplete() {
  const { isSignedIn } = useUser();

  useEffect(() => {
    // Give Clerk a moment to hydrate the session, then fire the deep link
    const timer = setTimeout(() => {
      window.location.href = "reelmotion://signin-done";
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">
        {isSignedIn ? "Signed in! Returning to app…" : "Completing sign-in…"}
      </p>
    </div>
  );
}
