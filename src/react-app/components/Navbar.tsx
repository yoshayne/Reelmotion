import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Menu, X, User, LogOut, Settings, Shield } from "lucide-react";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setProfileOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/5"
      style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link to={user ? "/browse" : "/"} className="flex-shrink-0">
          <span className="text-xl font-black tracking-tight">
            REELMOTI<span className="text-red-600">O</span>N™
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link to="/browse" className="text-gray-300 hover:text-white transition-colors text-sm">
                Browse
              </Link>
              <Link to="/contest" className="text-gray-300 hover:text-white transition-colors text-sm">
                Submit Film
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!isLoaded ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName ?? "Profile"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-sm font-medium truncate">{user.fullName || user.emailAddresses[0]?.emailAddress}</p>
                      <p className="text-xs text-gray-400 truncate">{user.emailAddresses[0]?.emailAddress}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Account
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-gray-400" />
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => openSignIn()}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black">
          {user ? (
            <div className="py-2">
              <Link
                to="/browse"
                onClick={() => setMenuOpen(false)}
                className="flex px-4 py-3 text-sm hover:bg-white/5 transition-colors"
              >
                Browse
              </Link>
              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
                className="flex px-4 py-3 text-sm hover:bg-white/5 transition-colors"
              >
                Account
              </Link>
              <Link
                to="/contest"
                onClick={() => setMenuOpen(false)}
                className="flex px-4 py-3 text-sm hover:bg-white/5 transition-colors"
              >
                Submit Film
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="py-2 px-4">
              <button
                onClick={() => { openSignIn(); setMenuOpen(false); }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
