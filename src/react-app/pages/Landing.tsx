import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Play, Film, Users, Zap, Heart } from "lucide-react";

export default function LandingPage() {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user) navigate("/browse");
  }, [isLoaded, user, navigate]);

  const features = [
    { icon: Film, title: "Independent Films", desc: "Discover stories you won't find on mainstream platforms" },
    { icon: Users, title: "Filmmaker Community", desc: "Connect with creators, watch Q&As and behind-the-scenes" },
    { icon: Zap, title: "Early Access", desc: "Members get first access to new releases" },
    { icon: Heart, title: "Support The Culture", desc: "Your membership directly supports independent filmmakers" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-8 h-14 bg-black/90 backdrop-blur-md border-b border-white/5"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
      >
        <span className="text-xl font-black tracking-tight">
          REELMOTI<span className="text-red-600">O</span>N™
        </span>
        <button
          onClick={() => openSignIn()}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center"
        style={{ paddingTop: "max(env(safe-area-inset-top), 3.5rem)" }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600/20 border border-red-600/30 rounded-full text-sm text-red-400 mb-6">
            <Film className="w-4 h-4" />
            Watch The Culture
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 leading-none">
            REELMOTI<span className="text-red-600">O</span>N™
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
            A community-first platform for independent film culture. Join thousands of filmmakers and fans.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openSignIn()}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              Start Watching
            </button>
            <Link
              to="/subscribe"
              className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-bold text-lg transition-colors"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-black text-center mb-12">
          More than <span className="text-red-600">streaming</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 bg-gray-900/50 border border-red-600/10 rounded-xl hover:border-red-600/30 transition-colors"
            >
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-1">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-black mb-4">Ready to join?</h2>
        <p className="text-gray-400 mb-8">Choose monthly or annual membership and start watching today.</p>
        <Link
          to="/subscribe"
          className="inline-block px-10 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg transition-colors"
        >
          Join the Community
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 text-center text-sm text-gray-600">
        <div className="flex justify-center gap-6 mb-3">
          <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          <Link to="/support" className="hover:text-gray-400 transition-colors">Support</Link>
          <Link to="/contest" className="hover:text-gray-400 transition-colors">Submit Film</Link>
          <Link to="/epk" className="hover:text-gray-400 transition-colors">EPK</Link>
        </div>
        <p>© {new Date().getFullYear()} ReelMotion. Watch The Culture.</p>
      </footer>
    </div>
  );
}
