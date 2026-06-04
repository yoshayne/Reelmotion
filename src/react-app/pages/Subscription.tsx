import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "@/react-app/utils/api";
import { hasAccess } from "@/react-app/utils/access";
import type { Subscription } from "@/shared/types";
import { CheckCircle, ExternalLink } from "lucide-react";

export default function SubscriptionPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) navigate("/");
  }, [isLoaded, user, navigate]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/billing/subscription")
      .then((r) => r.json() as Promise<Subscription | null>)
      .then(setSubscription)
      .finally(() => setLoading(false));
  }, [user]);

  const handleManage = async () => {
    setManagingPortal(true);
    const res = await apiFetch("/api/billing/create-portal-session", { method: "POST" });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    setManagingPortal(false);
  };

  const userHasAccess = hasAccess(subscription);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      <div
        className="max-w-lg mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <h1 className="text-2xl font-black mb-8">Membership</h1>

        {subscription && userHasAccess ? (
          <div className="bg-gray-900/50 border border-green-600/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-lg font-bold">Active Member</h2>
            </div>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Plan</span>
                <span className="capitalize">{subscription.plan} membership</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="capitalize text-green-400">{subscription.status}</span>
              </div>
              {subscription.period_end_date && (
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {subscription.status === "canceled" ? "Access until" : "Next billing"}
                  </span>
                  <span>{new Date(subscription.period_end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleManage}
              disabled={managingPortal}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {managingPortal ? "Opening..." : "Manage Membership"}
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">You don't have an active membership.</p>
            <Link
              to="/subscribe"
              className="px-8 py-3.5 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors"
            >
              Join the Community
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
