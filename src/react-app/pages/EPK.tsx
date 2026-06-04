import { useEffect, useState } from "react";
import Navbar from "@/react-app/components/Navbar";
import { Film, ExternalLink } from "lucide-react";

interface CoverArt {
  id: number;
  title: string;
  cover_image_url: string | null;
  thumbnail_url: string | null;
  content_type: string;
}

export default function EPKPage() {
  const [coverArt, setCoverArt] = useState<CoverArt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/cover-art")
      .then((r) => r.json() as Promise<CoverArt[]>)
      .then(setCoverArt)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div
        className="max-w-5xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            REELMOTI<span className="text-red-600">O</span>N™
          </h1>
          <p className="text-xl text-gray-400 mb-2">Electronic Press Kit</p>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">
            Watch The Culture — A community-first platform for independent film and filmmaker culture.
          </p>
        </div>

        {/* About */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-900/50 border border-red-600/10 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3">About ReelMotion</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              ReelMotion is a community-first streaming and culture platform dedicated to independent filmmakers.
              We amplify voices that mainstream platforms overlook, connecting passionate audiences with
              authentic storytelling.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-red-600/10 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3">Our Mission</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              "Watch The Culture" is more than a tagline — it's our commitment to preserving and celebrating
              independent film as a cultural force. We believe every story deserves to be seen.
            </p>
          </div>
        </div>

        {/* Press Contact */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-16">
          <h2 className="text-lg font-bold mb-4">Press & Media Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p className="text-white font-medium mb-1">General Inquiries</p>
              <a href="mailto:press@reelmotion.tv" className="text-red-500 hover:text-red-400 flex items-center gap-1">
                press@reelmotion.tv <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <p className="text-white font-medium mb-1">Film Submissions</p>
              <a href="/contest" className="text-red-500 hover:text-red-400 flex items-center gap-1">
                Submit your film <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Cover Art Gallery */}
        <div>
          <h2 className="text-2xl font-black mb-6">Film Gallery</h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-gray-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : coverArt.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {coverArt.map((item) => {
                const img = item.cover_image_url || item.thumbnail_url;
                return (
                  <div key={item.id} className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-red-600/10 hover:border-red-600/40 transition-colors">
                    {img ? (
                      <img
                        src={img}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Film className="w-8 h-8 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No content available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
