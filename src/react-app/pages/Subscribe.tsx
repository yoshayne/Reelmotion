import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "@/react-app/utils/api";
import { useBrandAssets } from "@/react-app/hooks/useBrandAssets";
import { Check, Film, Users, Zap, Heart, Crown } from "lucide-react";

export default function SubscribePage() {
  const { user, isLoaded } = useUser();
  const { logo, tagline } = useBrandAssets();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/billing/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ billingPeriod: selected }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to create checkout");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Film, text: "Watch all films and series in the community library" },
    { icon: Zap, text: "Early access to new releases" },
    { icon: Users, text: "Filmmaker Q&As and community events" },
    { icon: Heart, text: "Support independent film culture" },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed pointer-events-none" style={{ width: 220, height: 420, background: '#E8001D', opacity: 0.07, transform: 'rotate(18deg)', top: -60, right: -40, zIndex: 0 }} />

      {/* Header */}
      <div className="relative overflow-hidden" style={{ height: 100 }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(125deg, rgba(232,0,29,0.8) 0%, rgba(139,0,16,0.75) 35%, transparent 35.5%)' }} />
        <div className="absolute top-0 left-0 right-0 px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 60px)', paddingBottom: '12px' }}>
          <Link to="/browse">
            {logo ? (
              <img src={logo} alt="ReelMotion" className="h-7 w-auto" />
            ) : (
              <span className="text-white font-black text-base tracking-tight">REEL<span style={{ color: '#E8001D' }}>MOTION</span></span>
            )}
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-16 pt-4">
        {/* Heading */}
        <div className="mb-6">
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>BECOME A MEMBER</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' }}>
            Join the <span style={{ color: '#E8001D' }}>Community</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Become the Culture — unlimited access to independent film
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-7">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'rgba(232,0,29,0.12)',
                  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: '#E8001D' }} />
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className="space-y-3 mb-6">
          {/* Yearly plan */}
          <button
            onClick={() => setSelected("yearly")}
            className="w-full p-4 text-left transition-all relative rounded-xl"
            style={{
              border: selected === "yearly" ? '2px solid #E8001D' : '2px solid rgba(255,255,255,0.1)',
              backgroundColor: selected === "yearly" ? 'rgba(232,0,29,0.08)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
              <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                BEST VALUE
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(232,0,29,0.15)', color: '#fca5a5', border: '1px solid rgba(232,0,29,0.3)' }}>
                SAVE 50%
              </span>
            </div>
            <div className="flex items-start gap-3 pr-24">
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ borderColor: selected === "yearly" ? '#E8001D' : 'rgba(255,255,255,0.3)' }}
              >
                {selected === "yearly" && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E8001D' }} />}
              </div>
              <div>
                <p className="font-black">Annual Member Access</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black">$24.99</span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>/year</span>
                  <span className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>$49.99</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Billed once yearly · just $2.08/mo</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Early access pricing · subject to change</p>
              </div>
            </div>
            {selected === "yearly" && (
              <div className="mt-2 ml-7">
                <Check className="w-4 h-4 inline mr-1" style={{ color: '#E8001D' }} />
                <span className="text-xs font-bold" style={{ color: '#E8001D' }}>Selected</span>
              </div>
            )}
          </button>

          {/* Monthly plan */}
          <button
            onClick={() => setSelected("monthly")}
            className="w-full p-4 text-left transition-all rounded-xl"
            style={{
              border: selected === "monthly" ? '2px solid #E8001D' : '2px solid rgba(255,255,255,0.1)',
              backgroundColor: selected === "monthly" ? 'rgba(232,0,29,0.08)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ borderColor: selected === "monthly" ? '#E8001D' : 'rgba(255,255,255,0.3)' }}
              >
                {selected === "monthly" && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E8001D' }} />}
              </div>
              <div>
                <p className="font-black">Monthly Member Access</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black">$4.99</span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>/month</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Billed monthly · cancel anytime</p>
              </div>
            </div>
            {selected === "monthly" && (
              <div className="mt-2 ml-7">
                <Check className="w-4 h-4 inline mr-1" style={{ color: '#E8001D' }} />
                <span className="text-xs font-bold" style={{ color: '#E8001D' }}>Selected</span>
              </div>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(232,0,29,0.1)', border: '1px solid rgba(232,0,29,0.3)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Parallelogram CTA button */}
        <div className="mb-4">
          <button
            onClick={handleSubscribe}
            disabled={loading || !isLoaded}
            className="w-full flex items-center justify-center gap-3 py-4 font-black text-base tracking-wide transition-all"
            style={{
              backgroundColor: loading || !isLoaded ? 'rgba(100,100,100,0.5)' : '#E8001D',
              transform: 'skewX(-4deg)',
              cursor: loading || !isLoaded ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{ transform: 'skewX(4deg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  {`Join with ${selected === "yearly" ? "Annual" : "Monthly"} Membership`}
                </>
              )}
            </span>
          </button>
        </div>

        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Secure payment via Stripe · Cancel anytime via account settings
        </p>

        <div className="mt-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Link to="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          {" · "}
          <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
        </div>

        {/* Footer tagline */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <img
            src={tagline}
            alt="Watch The Culture"
            className="h-4 object-contain"
            style={{ opacity: 0.4 }}
          />
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    </div>
  );
}
