import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useEffectiveAuth } from "@/react-app/hooks/useEffectiveAuth";
import { apiFetch } from "@/react-app/utils/api";

export default function ManageSubscriptionPage() {
  const { isSignedIn, isLoaded } = useEffectiveAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      navigate("/");
      return;
    }
    apiFetch("/api/billing/create-portal-session", { method: "POST" })
      .then((r) => r.json() as Promise<{ url?: string; error?: string }>)
      .then((data) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          navigate("/account");
        }
      })
      .catch(() => navigate("/account"));
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Redirecting to membership portal...</p>
        </div>
      </div>
    </div>
  );
}
