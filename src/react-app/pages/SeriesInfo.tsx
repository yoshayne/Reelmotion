import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import type { Series, Video } from "@/shared/types";
import { Play, ChevronLeft } from "lucide-react";

export default function SeriesInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [firstEpisode, setFirstEpisode] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/series/${id}`).then((r) => r.json() as Promise<Series>),
      fetch(`/api/series/${id}/episodes`).then((r) => r.json() as Promise<Video[]>),
    ])
      .then(([s, eps]) => {
        setSeries(s);
        setFirstEpisode(eps[0] || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const imageUrl = series.hero_image_url || series.cover_image_url || series.carousel_image_url;

  return (
    <div className="min-h-screen bg-black text-white">


      <div className="relative h-72 md:h-[55vh] overflow-hidden">
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
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-300 hover:text-white"
          style={{ marginTop: "max(env(safe-area-inset-top), 72px)" }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-3xl md:text-4xl font-black mb-3">{series.title}</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {series.content_rating && (
            <span className="px-2 py-1 bg-gray-800 rounded text-xs">{series.content_rating}</span>
          )}
          {series.release_date && (
            <span className="px-2 py-1 bg-gray-800 rounded text-xs">
              {new Date(series.release_date).getFullYear()}
            </span>
          )}
          {series.episode_count != null && (
            <span className="px-2 py-1 bg-gray-800 rounded text-xs">
              {series.episode_count} episodes
            </span>
          )}
        </div>

        {series.description && (
          <p className="text-gray-300 leading-relaxed mb-6">{series.description}</p>
        )}
        {series.director && (
          <p className="text-sm text-gray-500 mb-1">
            <span className="text-gray-400">Director:</span> {series.director}
          </p>
        )}
        {series.cast && (
          <p className="text-sm text-gray-500 mb-6">
            <span className="text-gray-400">Cast:</span> {series.cast}
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <Link
            to={`/series/${series.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Play className="w-5 h-5 fill-black" />
            {firstEpisode ? "Watch Series" : "View Episodes"}
          </Link>
        </div>
      </div>
    </div>
  );
}
