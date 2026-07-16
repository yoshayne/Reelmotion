import { useSignIn, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useBrandAssets } from "@/react-app/hooks/useBrandAssets";

export default function Landing() {
  const { isSignedIn } = useUser();
  const { signIn } = useSignIn();
  const navigate = useNavigate();
  const { logo, tagline } = useBrandAssets();

  useEffect(() => {
    if (isSignedIn) navigate("/browse", { replace: true });
  }, [isSignedIn, navigate]);

  const handleGoogleSignIn = () => {
    if ((window as any).__NATIVE_APP__) {
      // Native app opens this page in SFSafariViewController (real browser).
      // Tell it which URL to open — the sign-in page configured to redirect
      // back to /native-signin-complete after OAuth completes.
      (window as any).ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "GOOGLE_SIGN_IN" })
      );
      return;
    }
    signIn?.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/browse",
    });
  };

  // Called from the native app via openBrowserAsync after sign-in completes
  // and the WebView reloads with the Clerk session cookie already set.
  // isSignedIn will become true and the useEffect above navigates to /browse.

  useEffect(() => {
    const onNativeSession = () => navigate("/browse", { replace: true });
    window.addEventListener("native-session-ready", onNativeSession);
    return () => window.removeEventListener("native-session-ready", onNativeSession);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white overflow-hidden relative flex items-center justify-center">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
          style={{ backgroundColor: 'rgba(232,0,29,0.05)', animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
          style={{ backgroundColor: 'rgba(245,158,11,0.05)', animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-4 py-12 flex flex-col items-center gap-8">
        {/* Logo */}
        {logo ? (
          <img src={logo} alt="ReelMotion" className="h-24 md:h-32 lg:h-40 w-auto object-contain" />
        ) : (
          <span className="text-white font-black text-4xl md:text-5xl tracking-tight">
            REEL<span style={{ color: '#E8001D' }}>MOTION</span>
          </span>
        )}

        {/* Tagline */}
        {tagline ? (
          <img src={tagline} alt="Watch The Culture" className="h-12 md:h-14 lg:h-16 w-auto object-contain" />
        ) : (
          <span className="text-zinc-400 text-sm font-semibold tracking-widest uppercase">Watch The Culture</span>
        )}

        {/* Sign-in card */}
        <div className="w-full relative">
          <div
            className="absolute -inset-1 rounded-2xl blur-xl opacity-30"
            style={{ background: 'linear-gradient(to right, rgba(232,0,29,0.3), rgba(245,158,11,0.3), rgba(232,0,29,0.3))' }}
          />
          <div className="relative bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8">
            {/* Top accent */}
            <div
              className="h-px w-full mb-6"
              style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.3), transparent)' }}
            />
            <h2 className="text-xl font-bold text-center mb-2">Join the Community</h2>
            <p className="text-sm text-zinc-400 text-center mb-6">Become the Culture</p>

            {/* Google button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-zinc-100 transition-all group relative overflow-hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>

            {/* Bottom accent */}
            <div
              className="h-px w-full mt-6"
              style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.3), transparent)' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8">
          {[['ORIGINAL', 'Content'], ['4K', 'Quality'], ['∞', 'Episodes']].map(([val, label]) => (
            <div key={val} className="text-center">
              <div className="text-2xl font-black" style={{ color: '#F59E0B' }}>{val}</div>
              <div className="text-xs text-zinc-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
