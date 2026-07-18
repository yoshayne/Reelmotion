import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";

// After web-based Google sign-in, Clerk lands here.
// We grab the session token and pass it in the deep link so the native app
// can inject it into the WebView — no cookie-sync required.
export default function NativeSigninComplete() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    const fireDeepLink = async () => {
      try {
        const token = await getToken();
        const userInfo = encodeURIComponent(JSON.stringify({
          id: user?.id ?? "",
          email: user?.primaryEmailAddress?.emailAddress ?? "",
          firstName: user?.firstName ?? "",
          imageUrl: user?.imageUrl ?? "",
        }));
        window.location.href = `reelmotion://signin-done?token=${encodeURIComponent(token ?? "")}&user=${userInfo}`;
      } catch {
        window.location.href = "reelmotion://signin-done";
      }
    };

    fireDeepLink();
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">
        {isSignedIn ? "Signed in! Returning to app…" : "Completing sign-in…"}
      </p>
    </div>
  );
}
