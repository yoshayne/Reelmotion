import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/react-app/components/Navbar";
import { apiFetch } from "@/react-app/utils/api";
import { hasAccess } from "@/react-app/utils/access";
import type { Series, Video, Subscription } from "@/shared/types";
import { Play, Lock, ChevronLeft } from "lucide-react";

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Video[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/series/${id}`).then((r) => r.json() as Promise<Series>),
      fetch(`/api/series/${id}/episodes`).then((r) => r.json() as Promise<Video[]>),
    ])
      .then(([s, ep]) => {
        setSeries(s);
        setEpisodes(ep);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/billing/subscription")
      .then((r) => r.json() as Promise<Subscription | null>)
      .then(setSubscription);
  }, [user]);

  const userHasAccess = hasAccess(subscription);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Series not found</p>
        <Link to="/browse" className="text-red-500">Back to Browse</Link>
      </div>
    );
  }

  const imageUrl = series.hero_image_url || series.cover_image_url;
  const seasons = [...new Set(episodes.map((e) => e.season_number ?? 1))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {imageUrl && (
          <>
            <img
              src={imageUrl}
              alt={series.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
          </>
        )}
        <div
          className="absolute bottom-0 left-0 p-6"
          style={{ paddingTop: "max(env(safe-area-inset-top), 80px)" }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl md:text-4xl font-black">{series.title}</h1>
          {series.content_rating && (
            <span className="mt-2 inline-block px-2 py-0.5 bg-gray-800 rounded text-xs">
              {series.content_rating}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Meta */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-400">
          {series.director && <span>Director: {series.director}</span>}
          {series.release_date && <span>{new Date(series.release_date).getFullYear()}</span>}
          <span>{episodes.length} episodes</span>
        </div>

        {series.description && (
          <p className="text-gray-300 leading-relaxed mb-6">{series.description}</p>
        )}

        {series.cast && (
          <p className="text-sm text-gray-500 mb-6">
            <span className="text-gray-400">Cast:</span> {series.cast}
          </p>
        )}

        {/* Episodes by season */}
        {seasons.map((season) => {
          const seasonEpisodes = episodes.filter((e) => (e.season_number ?? 1) === season);
          return (
            <div key={season} className="mb-8">
              {seasons.length > 1 && (
                <h2 className="text-lg font-bold mb-4">Season {season}</h2>
              )}
              <div className="space-y-3">
                {seasonEpisodes.map((ep) => {
                  const canWatch = userHasAccess || ep.is_free;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => navigate(`/watch/${ep.id}`)}
                      className="flex gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl cursor-pointer hover:border-red-600/40 transition-colors group"
                    >
                      <div className="relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-gray-800">
                        {ep.thumbnail_url ? (
                          <img
                            src={ep.thumbnail_url}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canWatch ? (
                            <Play className="w-8 h-8 fill-white" />
                          ) : (
                            <Lock className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Episode {ep.episode_number}</p>
                            <p className="font-medium truncate">{ep.title}</p>
                          </div>
                          {!canWatch && <Lock className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />}
                        </div>
                        {ep.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{ep.description}</p>
                        )}
                        {ep.mux_duration && (
                          <p className="text-xs text-gray-600 mt-1">
                            {Math.floor(ep.mux_duration / 60)} min
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!userHasAccess && (
          <div className="mt-6 p-5 bg-red-600/10 border border-red-600/30 rounded-xl text-center">
            <p className="font-semibold mb-1">Join to watch the full series</p>
            <p className="text-sm text-gray-400 mb-4">
              Become a member to unlock all episodes.
            </p>
            <Link
              to="/subscribe"
              className="inline-block px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Join the Community
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
