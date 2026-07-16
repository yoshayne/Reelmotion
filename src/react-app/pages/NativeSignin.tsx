import { useSignIn, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

// Opened by the iOS native app in SFSafariViewController (a real browser).
// Immediately kicks off Google OAuth. After sign-in, Clerk redirects to
// /native-signin-complete which fires the reelmotion:// deep link.
export default function NativeSignin() {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    // Already signed in — go straight to the complete page
    if (isSignedIn) {
      navigate("/native-signin-complete", { replace: true });
      return;
    }
    signIn?.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/native-signin-complete",
    });
  }, [isLoaded, isSignedIn, signIn, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
