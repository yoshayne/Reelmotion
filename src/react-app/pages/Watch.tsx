import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import MuxPlayerWrapper from "@/react-app/components/MuxPlayerWrapper";
import { apiFetch } from "@/react-app/utils/api";
import { hasAccess } from "@/react-app/utils/access";
import { useBrandAssets } from "@/react-app/hooks/useBrandAssets";
import type { Video, Subscription } from "@/shared/types";
import { Bookmark, BookmarkCheck, ChevronRight, Lock, Play, ArrowLeft, SkipForward } from "lucide-react";

interface WatchData {
  video: Video;
  nextEpisode: Video | null;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { tagline } = useBrandAssets();
  const [watchData, setWatchData] = useState<WatchData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);


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
    if (!isLoaded || !user || !watchData) return;
    Promise.all([
      apiFetch("/api/billing/subscription").then((r) => r.json() as Promise<Subscription | null>),
      apiFetch("/api/watchlist").then((r) => r.json() as Promise<Video[]>).catch(() => []),
      apiFetch("/api/playback-history").then((r) => r.json() as Promise<Array<{ video_id: number; last_position_seconds: number }>>).catch(() => []),
    ]).then(([sub, wl, history]) => {
      setSubscription(sub);
      setInWatchlist(Array.isArray(wl) && wl.some((v) => v.id === watchData.video.id));
      const pos = Array.isArray(history) && history.find((h) => h.video_id === watchData.video.id);
      if (pos && pos.last_position_seconds > 5) {
        setStartTime(pos.last_position_seconds);
      }
    });
  }, [user, isLoaded, watchData]);

  // Detect skip intro window
  useEffect(() => {
    if (!watchData?.video) return;
    const { intro_start_seconds, intro_end_seconds } = watchData.video;
    if (intro_start_seconds == null || intro_end_seconds == null) return;
    const inIntro = currentTime >= intro_start_seconds && currentTime < intro_end_seconds;
    setShowSkipIntro(inIntro);
  }, [currentTime, watchData]);

  const userHasAccess = hasAccess(subscription);
  const canWatch = userHasAccess || watchData?.video.is_free;

  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (!user || !watchData) return;
      const duration = watchData.video.mux_duration ?? 0;
      const completed = duration > 0 && time / duration > 0.9;
      apiFetch("/api/playback-history", {
        method: "POST",
        body: JSON.stringify({
          video_id: watchData.video.id,
          last_position_seconds: time,
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
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: '#E8001D', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !watchData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Video not found</p>
        <Link to="/browse" style={{ color: '#E8001D' }} className="hover:underline">
          Back to Browse
        </Link>
      </div>
    );
  }

  const { video, nextEpisode } = watchData;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back button */}
      <div
        className="fixed top-0 left-0 z-50 p-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 60px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div style={{ paddingTop: 'max(env(safe-area-inset-top), 60px)' }}>
        {/* Player or paywall */}
        {canWatch ? (
          <div className="relative">
            <MuxPlayerWrapper
              video={video}
              startTime={startTime}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                if (nextEpisode) navigate(`/watch/${nextEpisode.id}`);
              }}
              autoPlay
            />
            {/* Skip intro button */}
            {showSkipIntro && (
              <div className="absolute bottom-16 right-4 z-10">
                <button
                  onClick={() => {
                    // Signal player to seek to intro_end_seconds via external means if needed
                    setShowSkipIntro(false);
                  }}
                  style={{ transform: 'skewX(-6deg)', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(0,0,0,0.8)', padding: '8px 16px' }}
                >
                  <span className="flex items-center gap-2 font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(6deg)', display: 'block' }}>
                    <SkipForward className="w-3.5 h-3.5 inline" /> Skip Intro
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-video bg-zinc-900 flex flex-col items-center justify-center gap-4 px-4">
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <Lock className="w-10 h-10" style={{ color: '#E8001D' }} />
              </div>
              <h3 className="text-xl font-black">Members Only</h3>
              <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Join the ReelMotion community to watch this film.
              </p>
              {!user ? (
                <Link to="/">
                  <div style={{ transform: 'skewX(-6deg)', backgroundColor: '#E8001D', padding: '12px 24px', display: 'inline-block' }}>
                    <span className="font-extrabold text-sm tracking-[0.08em] uppercase" style={{ transform: 'skewX(6deg)', display: 'block' }}>
                      Sign In to Watch
                    </span>
                  </div>
                </Link>
              ) : (
                <Link to="/subscribe">
                  <div style={{ transform: 'skewX(-6deg)', backgroundColor: '#E8001D', padding: '12px 24px', display: 'inline-block' }}>
                    <span className="font-extrabold text-sm tracking-[0.08em] uppercase" style={{ transform: 'skewX(6deg)', display: 'block' }}>
                      Join the Community
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Video info */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black" style={{ letterSpacing: '-0.02em' }}>{video.title}</h1>
              {video.series_title && (
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {video.series_title}
                  {video.season_number != null && video.episode_number != null && (
                    <span className="ml-2">S{video.season_number} E{video.episode_number}</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={toggleWatchlist}
              className="flex-shrink-0 flex flex-col items-center gap-1 transition-colors"
              style={{ color: inWatchlist ? '#E8001D' : 'rgba(255,255,255,0.4)' }}
            >
              {inWatchlist ? (
                <BookmarkCheck className="w-6 h-6" />
              ) : (
                <Bookmark className="w-6 h-6" />
              )}
              <span className="text-xs font-bold tracking-widest uppercase" style={{ fontSize: 9 }}>
                {inWatchlist ? "Saved" : "My List"}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {video.content_rating && (
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>{video.content_rating}</span>
            )}
            {video.genre && (
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(232,0,29,0.1)', border: '1px solid rgba(232,0,29,0.2)', color: '#E8001D' }}>{video.genre}</span>
            )}
            {video.release_date && (
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {new Date(video.release_date).getFullYear()}
              </span>
            )}
            {video.mux_duration && (
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {Math.floor(video.mux_duration / 60)} min
              </span>
            )}
          </div>

          {video.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>{video.description}</p>
          )}

          {video.director && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Director:</span> {video.director}
            </p>
          )}
          {video.cast && (
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Cast:</span> {video.cast}
            </p>
          )}

          {/* Next episode */}
          {nextEpisode && (
            <div
              className="mt-6 p-4 rounded-xl cursor-pointer group"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              onClick={() => navigate(`/watch/${nextEpisode.id}`)}
            >
              <p className="text-xs font-extrabold tracking-[0.15em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Next Episode</p>
              <div className="flex gap-3">
                {nextEpisode.thumbnail_url && (
                  <div
                    className="relative flex-shrink-0 w-32 overflow-hidden"
                    style={{ aspectRatio: '16/9', clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
                  >
                    <img
                      src={nextEpisode.thumbnail_url}
                      alt={nextEpisode.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <Play className="w-6 h-6 fill-white" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate group-hover:text-[#E8001D] transition-colors">
                    {nextEpisode.title}
                  </p>
                  {nextEpisode.episode_number != null && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      S{nextEpisode.season_number ?? 1} E{nextEpisode.episode_number}
                    </p>
                  )}
                  {nextEpisode.description && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{nextEpisode.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0 self-center" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
          )}

          {/* Series link */}
          {video.series_id && (
            <Link
              to={`/series/${video.series_id}`}
              className="mt-4 flex items-center gap-2 text-sm transition-colors"
              style={{ color: '#E8001D' }}
            >
              View all episodes <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          {/* Footer */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <img
              src={tagline}
              alt="Watch The Culture"
              className="h-4 object-contain"
              style={{ opacity: 0.4 }}
            />
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
