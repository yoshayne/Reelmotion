import { Link, useNavigate } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Search, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/react-app/utils/api";
import { useBrandAssets } from "@/react-app/hooks/useBrandAssets";

export default function Navbar() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [logoError, setLogoError] = useState(false);
  const { logo: logoUrl } = useBrandAssets();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowAccountMenu(false);
    };
    if (showAccountMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAccountMenu]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/users/me").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role || "");
        setAvatarUrl(data.avatar_url || "");
      }
    }).catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const profilePic = avatarUrl || user?.imageUrl || "";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 bg-black/90 backdrop-blur-md border-b border-white/5"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', paddingBottom: '12px' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-12">
        <div className="flex items-center gap-8">
          <Link to="/browse" className="flex items-center">
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt="ReelMotion"
                className="h-8 w-auto"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-white font-black text-lg tracking-tight">
                REEL<span style={{ color: '#E8001D' }}>MOTION</span>
              </span>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/browse" className="hover:text-[#E8001D] transition-colors font-medium">Browse</Link>
            {(userRole === "admin" || userRole === "creator") && (
              <Link to="/admin" className="hover:text-[#E8001D] transition-colors font-medium">Admin</Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSignedIn && (
            <button
              onClick={handleLogout}
              className="hidden md:block text-xs font-bold tracking-wide px-3 py-1.5 border border-white/20 hover:border-[#E8001D]/50 hover:text-[#E8001D] transition-colors"
              style={{ transform: 'skewX(-6deg)' }}
            >
              <span style={{ transform: 'skewX(6deg)', display: 'block' }}>SIGN OUT</span>
            </button>
          )}
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
            <Search className="w-5 h-5" style={{ color: '#E8001D' }} />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => isSignedIn ? setShowAccountMenu(!showAccountMenu) : navigate("/")}
              className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <div className="relative w-9 h-9">
                {/* Always show red circle base */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#E8001D' }}
                >
                  <User className="w-5 h-5 text-white" />
                </div>
                {/* Overlay profile pic on top if available */}
                {profilePic && (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="absolute inset-0 w-9 h-9 rounded-full object-cover"
                    style={{ outline: '2px solid rgba(232,0,29,0.5)', outlineOffset: '1px' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
            </button>
            {isSignedIn && showAccountMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-gray-900 border rounded-lg shadow-xl py-2 backdrop-blur-xl z-50"
                style={{ borderColor: 'rgba(232,0,29,0.3)', boxShadow: '0 20px 60px rgba(232,0,29,0.2)' }}
              >
                <Link
                  to="/account"
                  className="block px-4 py-3 text-sm hover:bg-[#E8001D]/20 transition-colors"
                  onClick={() => setShowAccountMenu(false)}
                >
                  Account
                </Link>
                {(userRole === "admin" || userRole === "creator") && (
                  <Link
                    to="/admin"
                    className="block px-4 py-3 text-sm hover:bg-[#E8001D]/20 transition-colors md:hidden"
                    onClick={() => setShowAccountMenu(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="border-t my-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-[#E8001D]/20 transition-colors text-red-400"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
