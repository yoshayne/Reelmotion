import { useEffect, useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router";
import { Camera, CheckCircle, ExternalLink, LogOut, Crown, User } from "lucide-react";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import { useBrandAssets } from "@/react-app/hooks/useBrandAssets";
import { hasAccess } from "@/react-app/utils/access";
import type { Subscription } from "@/shared/types";

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return (email || "?")[0].toUpperCase();
}

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { logo, tagline } = useBrandAssets();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) navigate("/");
  }, [isLoaded, user, navigate]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/users/me")
      .then((r) => r.json() as Promise<{ display_name: string; avatar_url: string; subscription: Subscription | null; role: string }>)
      .then((data) => {
        setDisplayName(data.display_name || user.fullName || "");
        setAvatarUrl(data.avatar_url || user.imageUrl || null);
        setSubscription(data.subscription);
        setUserRole(data.role || "");
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

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const userHasAccess = hasAccess(subscription);
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const name = displayName || user?.fullName || "";
  const initials = getInitials(name, email);
  const profilePic = avatarUrl;

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed pointer-events-none" style={{ width: 220, height: 420, background: '#E8001D', opacity: 0.07, transform: 'rotate(18deg)', top: -60, right: -40, zIndex: 0 }} />

      {/* Diagonal banner header */}
      <div className="relative overflow-hidden" style={{ height: 160 }}>
        {/* Diagonal color split */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(125deg, rgba(232,0,29,0.9) 0%, rgba(139,0,16,0.85) 40%, rgba(0,0,0,0.95) 40.5%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, #000 100%)' }} />

        {/* Logo */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 60px)', paddingBottom: '12px' }}>
          <Link to="/browse">
            {logo ? (
              <img src={logo} alt="ReelMotion" className="h-7 w-auto" />
            ) : (
              <span className="text-white font-black text-base tracking-tight">REEL<span style={{ color: '#E8001D' }}>MOTION</span></span>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Ghost initials */}
        <span className="absolute right-4 top-8 select-none pointer-events-none font-black" style={{ fontSize: 90, fontWeight: 900, color: 'rgba(0,0,0,0.25)', WebkitTextStroke: '1px rgba(255,255,255,0.06)', lineHeight: 1 }}>
          {initials}
        </span>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-16 -mt-8">
        {/* Avatar + name row */}
        <div className="flex items-end gap-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2" style={{ borderColor: '#E8001D' }}>
              {profilePic ? (
                <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black" style={{ backgroundColor: '#E8001D' }}>
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full transition-colors"
              style={{ backgroundColor: '#E8001D' }}
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
          <div className="pb-1">
            <p className="text-lg font-black">{name || "User"}</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{email}</p>
            {(userRole === "admin" || userRole === "creator") && (
              <div className="flex items-center gap-1 mt-1">
                <Crown className="w-3 h-3" style={{ color: '#F59E0B' }} />
                <span className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: '#F59E0B' }}>{userRole}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4" style={{ color: '#E8001D' }} />
            <h2 className="font-black tracking-tight">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#E8001D'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              />
            </div>
          </div>
          {/* Parallelogram SAVE button */}
          <div className="mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ transform: 'skewX(-8deg)', backgroundColor: saved ? 'rgba(34,197,94,0.8)' : saving ? 'rgba(100,100,100,0.6)' : '#E8001D', padding: '10px 24px', display: 'inline-block' }}
            >
              <span className="flex items-center gap-2 font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(8deg)', display: 'block' }}>
                {saved ? (
                  <><CheckCircle className="w-3.5 h-3.5 inline" /> Saved!</>
                ) : saving ? (
                  "Saving..."
                ) : (
                  "Save Changes"
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Membership */}
        <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4" style={{ color: '#E8001D' }} />
            <h2 className="font-black tracking-tight">Membership</h2>
          </div>
          {subscription && userHasAccess ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold capitalize">{subscription.plan} Member</p>
                  <p className="text-sm capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{subscription.status}</p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                  Active
                </div>
              </div>
              {subscription.period_end_date && (
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {subscription.status === "canceled" ? "Access until" : "Renews"}{" "}
                  {new Date(subscription.period_end_date).toLocaleDateString()}
                </p>
              )}
              {/* Parallelogram Manage button */}
              <button
                onClick={handleManageSubscription}
                disabled={managingPortal}
                style={{ transform: 'skewX(-8deg)', border: '1px solid rgba(232,0,29,0.4)', padding: '10px 20px', display: 'inline-block', backgroundColor: 'rgba(232,0,29,0.1)' }}
              >
                <span className="flex items-center gap-2 font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(8deg)', display: 'block', color: '#E8001D' }}>
                  <ExternalLink className="w-3.5 h-3.5 inline" />
                  {managingPortal ? "Opening..." : "Manage Membership"}
                </span>
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>You don't have an active membership.</p>
              {/* Parallelogram Join button */}
              <Link to="/subscribe">
                <div style={{ transform: 'skewX(-8deg)', backgroundColor: '#E8001D', padding: '11px 24px', display: 'inline-block' }}>
                  <span className="font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(8deg)', display: 'block' }}>
                    Join the Community
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Quick links with corner-notched icon boxes */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Browse", href: "/browse", icon: "▶" },
            { label: "Support", href: "/support", icon: "?" },
            { label: "Terms", href: "/terms", icon: "§" },
            { label: "Privacy", href: "/privacy", icon: "🔒" },
          ].map(({ label, href, icon }) => (
            <Link key={href} to={href}>
              <div
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(232,0,29,0.12)',
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
                    color: '#E8001D',
                  }}
                >
                  {icon}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Danger zone */}
        <div className="rounded-xl p-5 mb-4" style={{ border: '1px solid rgba(232,0,29,0.2)' }}>
          <h2 className="font-black text-sm mb-2" style={{ color: 'rgba(232,0,29,0.8)' }}>Danger Zone</h2>
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Permanently delete your account and all data.
          </p>
          <Link
            to="/delete-account"
            className="text-sm transition-colors"
            style={{ color: 'rgba(232,0,29,0.7)' }}
          >
            Delete my account →
          </Link>
        </div>

        {/* Footer tagline */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          {tagline ? (
            <img src={tagline} alt="Watch The Culture" className="h-4 object-contain" style={{ opacity: 0.4 }} />
          ) : (
            <span className="text-[10px] font-semibold tracking-widest uppercase text-white/25">Watch The Culture</span>
          )}
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    </div>
  );
}
