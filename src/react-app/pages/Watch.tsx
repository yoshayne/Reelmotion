import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/react-app/components/Navbar";
import MuxPlayerWrapper from "@/react-app/components/MuxPlayerWrapper";
import { apiFetch } from "@/react-app/utils/api";
import { hasAccess } from "@/react-app/utils/access";
import type { Video, Subscription } from "@/shared/types";
import { Bookmark, BookmarkCheck, ChevronRight, Lock, Play } from "lucide-react";

interface WatchData {
  video: Video;
  nextEpisode: Video | null;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [watchData, setWatchData] = useState<WatchData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/watch/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<WatchData>;
      })
      .then(setWatchData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      apiFetch("/api/billing/subscription").then((r) => r.json() as Promise<Subscription | null>),
      apiFetch("/api/watchlist").then((r) => r.json() as Promise<Video[]>),
      apiFetch("/api/playback-history").then((r) => r.json() as Promise<Array<{ video_id: number; last_position_seconds: number }>>),
    ]).then(([sub, wl, history]) => {
      setSubscription(sub);
      setInWatchlist(wl.some((v) => v.id === watchData?.video.id));
      const pos = history.find((h) => h.video_id === watchData?.video.id);
      if (pos && pos.last_position_seconds > 5) {
        setStartTime(pos.last_position_seconds);
      }
    });
  }, [user, isLoaded, watchData]);

  const userHasAccess = hasAccess(subscription);
  const canWatch = userHasAccess || watchData?.video.is_free;

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!user || !watchData) return;
      const duration = watchData.video.mux_duration ?? 0;
      const completed = duration > 0 && currentTime / duration > 0.9;
      apiFetch("/api/playback-history", {
        method: "POST",
        body: JSON.stringify({
          video_id: watchData.video.id,
          last_position_seconds: currentTime,
          completed,
        }),
      }).catch(() => {});
    },
    [user, watchData]
  );

  const toggleWatchlist = async () => {
    if (!user || !watchData) {
      navigate("/subscribe");
      return;
    }
    if (inWatchlist) {
      await apiFetch(`/api/watchlist/${watchData.video.id}`, { method: "DELETE" });
      setInWatchlist(false);
    } else {
      await apiFetch("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ video_id: watchData.video.id }),
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

  if (error || !watchData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Video not found</p>
        <Link to="/browse" className="text-red-500 hover:text-red-400">
          Back to Browse
        </Link>
      </div>
    );
  }

  const { video, nextEpisode } = watchData;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 3.5rem)" }}>
        {/* Player or paywall */}
        {canWatch ? (
          <MuxPlayerWrapper
            video={video}
            startTime={startTime}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              if (nextEpisode) navigate(`/watch/${nextEpisode.id}`);
            }}
            autoPlay
          />
        ) : (
          <div className="relative aspect-video bg-gray-900 flex flex-col items-center justify-center gap-4 px-4">
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-black/50 rounded-full">
                <Lock className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold">Members Only</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Join the ReelMotion community to watch this film.
              </p>
              {!user ? (
                <Link
                  to="/"
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors"
                >
                  Sign In to Watch
                </Link>
              ) : (
                <Link
                  to="/subscribe"
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors"
                >
                  Join the Community
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Video info */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">{video.title}</h1>
              {video.series_title && (
                <p className="text-gray-400 mt-1">
                  {video.series_title}
                  {video.season_number != null && video.episode_number != null && (
                    <span className="ml-2">S{video.season_number} E{video.episode_number}</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={toggleWatchlist}
              className="flex-shrink-0 flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors"
            >
              {inWatchlist ? (
                <BookmarkCheck className="w-6 h-6 text-red-500" />
              ) : (
                <Bookmark className="w-6 h-6" />
              )}
              <span className="text-xs">{inWatchlist ? "Saved" : "My List"}</span>
            </button>
          </div>

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
          </div>

          {video.description && (
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{video.description}</p>
          )}

          {video.director && (
            <p className="text-sm text-gray-500">
              <span className="text-gray-400">Director:</span> {video.director}
            </p>
          )}
          {video.cast && (
            <p className="text-sm text-gray-500 mt-1">
              <span className="text-gray-400">Cast:</span> {video.cast}
            </p>
          )}

          {/* Next episode */}
          {nextEpisode && (
            <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Next Episode</p>
              <div
                onClick={() => navigate(`/watch/${nextEpisode.id}`)}
                className="flex gap-3 cursor-pointer group"
              >
                {nextEpisode.thumbnail_url && (
                  <div className="relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden">
                    <img
                      src={nextEpisode.thumbnail_url}
                      alt={nextEpisode.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-6 h-6 fill-white" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-red-400 transition-colors">
                    {nextEpisode.title}
                  </p>
                  {nextEpisode.episode_number != null && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      S{nextEpisode.season_number ?? 1} E{nextEpisode.episode_number}
                    </p>
                  )}
                  {nextEpisode.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{nextEpisode.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 self-center" />
              </div>
            </div>
          )}

          {/* Series link */}
          {video.series_id && (
            <Link
              to={`/series/${video.series_id}`}
              className="mt-4 flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              View all episodes <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
