import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "@/react-app/utils/api";
import { hasAccess } from "@/react-app/utils/access";
import type { Video, Subscription } from "@/shared/types";
import { Play, Lock, Bookmark, BookmarkCheck, ChevronLeft } from "lucide-react";

export default function MovieInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [video, setVideo] = useState<Video | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/watch/${id}`)
      .then((r) => r.json() as Promise<{ video: Video }>)
      .then((d) => setVideo(d.video))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiFetch("/api/billing/subscription").then((r) => r.json() as Promise<Subscription | null>),
      apiFetch("/api/watchlist").then((r) => r.json() as Promise<Video[]>),
    ]).then(([sub, wl]) => {
      setSubscription(sub);
      setInWatchlist(wl.some((v) => v.id === Number(id)));
    });
  }, [user, id]);

  const userHasAccess = hasAccess(subscription);
  const canWatch = userHasAccess || video?.is_free;

  const toggleWatchlist = async () => {
    if (!user) return;
    if (inWatchlist) {
      await apiFetch(`/api/watchlist/${id}`, { method: "DELETE" });
      setInWatchlist(false);
    } else {
      await apiFetch("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ video_id: Number(id) }),
      });
      setInWatchlist(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Content not found</p>
        <Link to="/browse" className="text-red-500">Back to Browse</Link>
      </div>
    );
  }

  const imageUrl = video.hero_image_url || video.carousel_image_url || video.thumbnail_url;

  return (
    <div className="min-h-screen bg-black text-white">


      {/* Hero */}
      <div className="relative h-64 md:h-[50vh] overflow-hidden">
        {imageUrl && (
          <>
            <img
              src={imageUrl}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
          </>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
          style={{ marginTop: "max(env(safe-area-inset-top), 72px)" }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-3xl md:text-4xl font-black mb-3">{video.title}</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {video.content_rating && (
            <span className="px-2 py-1 bg-gray-800 rounded text-xs">{video.content_rating}</span>
          )}
          {video.genre && (
            <span className="px-2 py-1 bg-gray-800 rounded text-xs">{video.genre}</span>
          )}
          {video.release_date && (
            <span className="px-2 py-1 bg-gray-800 rounded text-xs">
              {new Date(video.release_date).getFullYear()}
            </span>
          )}
          {video.mux_duration && (
            <span className="px-2 py-1 bg-gray-800 rounded text-xs">
              {Math.floor(video.mux_duration / 60)} min
            </span>
          )}
          {video.is_free && (
            <span className="px-2 py-1 bg-green-600 rounded text-xs font-bold">FREE</span>
          )}
        </div>

        {video.description && (
          <p className="text-gray-300 leading-relaxed mb-6">{video.description}</p>
        )}

        {video.director && (
          <p className="text-sm text-gray-500 mb-1">
            <span className="text-gray-400">Director:</span> {video.director}
          </p>
        )}
        {video.cast && (
          <p className="text-sm text-gray-500 mb-6">
            <span className="text-gray-400">Cast:</span> {video.cast}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          {canWatch ? (
            <Link
              to={`/watch/${video.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Play className="w-5 h-5 fill-black" />
              Play
            </Link>
          ) : (
            <Link
              to="/subscribe"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 font-bold rounded-xl transition-colors"
            >
              <Lock className="w-5 h-5" />
              Join to Watch
            </Link>
          )}
          {user && (
            <button
              onClick={toggleWatchlist}
              className="px-5 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center gap-2 font-medium transition-colors"
            >
              {inWatchlist ? (
                <BookmarkCheck className="w-5 h-5 text-red-500" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
              {inWatchlist ? "Saved" : "My List"}
            </button>
          )}
        </div>

        {video.series_id && (
          <Link
            to={`/series/${video.series_id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            View full series
          </Link>
        )}
      </div>
    </div>
  );
}
