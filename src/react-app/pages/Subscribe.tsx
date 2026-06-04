import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import Navbar from "@/react-app/components/Navbar";
import { apiFetch } from "@/react-app/utils/api";
import { Check, Film, Users, Zap, Heart } from "lucide-react";

export default function SubscribePage() {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) {
      openSignIn({ redirectUrl: "/subscribe" });
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
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div
        className="max-w-lg mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">
            Join the <span className="text-red-600">Community</span>
          </h1>
          <p className="text-gray-400">
            Watch The Culture — unlimited access to independent film
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-gray-300">{text}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelected("yearly")}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
              selected === "yearly"
                ? "border-red-600 bg-red-600/10"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            <div className="absolute top-3 right-3 text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
              Best Value
            </div>
            <div className="flex items-start justify-between pr-20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selected === "yearly" ? "border-red-600" : "border-gray-500"
                    }`}
                  >
                    {selected === "yearly" && (
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                    )}
                  </div>
                  <span className="font-bold">Annual Member Access</span>
                </div>
                <p className="text-sm text-gray-400 ml-6">Pay once yearly — save 20%</p>
              </div>
            </div>
            {selected === "yearly" && (
              <div className="mt-2 ml-6">
                <Check className="w-4 h-4 text-red-500 inline mr-1" />
                <span className="text-xs text-red-400">Selected</span>
              </div>
            )}
          </button>

          <button
            onClick={() => setSelected("monthly")}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected === "monthly"
                ? "border-red-600 bg-red-600/10"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            <div className="flex items-start">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                  selected === "monthly" ? "border-red-600" : "border-gray-500"
                }`}
              >
                {selected === "monthly" && (
                  <div className="w-2 h-2 bg-red-600 rounded-full" />
                )}
              </div>
              <div>
                <p className="font-bold">Monthly Member Access</p>
                <p className="text-sm text-gray-400 mt-0.5">Billed monthly, cancel anytime</p>
              </div>
            </div>
            {selected === "monthly" && (
              <div className="mt-2 ml-7">
                <Check className="w-4 h-4 text-red-500 inline mr-1" />
                <span className="text-xs text-red-400">Selected</span>
              </div>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-600/40 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading || !isLoaded}
          className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting to checkout...
            </span>
          ) : (
            `Join with ${selected === "yearly" ? "Annual" : "Monthly"} Membership`
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Secure payment via Stripe · Cancel anytime via account settings
        </p>

        <div className="mt-8 text-center text-sm text-gray-600">
          <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          {" · "}
          <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
