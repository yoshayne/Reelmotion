import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/react-app/components/Navbar";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import { hasAccess } from "@/react-app/utils/access";
import type { Subscription } from "@/shared/types";
import { Camera, CheckCircle, ExternalLink } from "lucide-react";

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) navigate("/");
  }, [isLoaded, user, navigate]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/users/me")
      .then((r) => r.json() as Promise<{ display_name: string; avatar_url: string; subscription: Subscription | null }>)
      .then((data) => {
        setDisplayName(data.display_name || user.fullName || "");
        setAvatarUrl(data.avatar_url || user.imageUrl || null);
        setSubscription(data.subscription);
      });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await apiFetch("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify({ display_name: displayName }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiFetchForm("/api/users/profile-picture", fd);
    const data = await res.json() as { url: string };
    setAvatarUrl(data.url);
    setUploadingAvatar(false);
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    const res = await apiFetch("/api/billing/create-portal-session", { method: "POST" });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    setManagingPortal(false);
  };

  const userHasAccess = hasAccess(subscription);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div
        className="max-w-lg mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <h1 className="text-2xl font-black mb-8">Account</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-2 border-red-600/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600/20 flex items-center justify-center text-2xl font-bold text-red-500">
                  {(displayName || user?.firstName || "?")[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-semibold">{displayName || user?.fullName}</p>
            <p className="text-sm text-gray-400">{user?.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>

        {/* Profile form */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-4">
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.emailAddresses[0]?.emailAddress ?? ""}
                disabled
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

        {/* Membership */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-4">
          <h2 className="font-semibold mb-4">Membership</h2>
          {subscription && userHasAccess ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium capitalize">{subscription.plan} Member</p>
                  <p className="text-sm text-gray-400 capitalize">{subscription.status}</p>
                </div>
                <div className="px-3 py-1 bg-green-600/20 border border-green-600/30 rounded-full text-sm text-green-400">
                  Active
                </div>
              </div>
              {subscription.period_end_date && (
                <p className="text-xs text-gray-500 mb-4">
                  {subscription.status === "canceled" ? "Access until" : "Renews"}{" "}
                  {new Date(subscription.period_end_date).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={handleManageSubscription}
                disabled={managingPortal}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {managingPortal ? "Opening portal..." : "Manage Membership"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-sm mb-4">You don't have an active membership.</p>
              <Link
                to="/subscribe"
                className="block w-full py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Join the Community
              </Link>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="border border-red-900/30 rounded-xl p-5">
          <h2 className="font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Permanently delete your account and all data.
          </p>
          <Link
            to="/delete-account"
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Delete my account
          </Link>
        </div>
      </div>
    </div>
  );
}
