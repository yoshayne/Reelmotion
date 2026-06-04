import { useNavigate } from "react-router";
import { Film } from "lucide-react";
import type { Series } from "@/shared/types";

interface SeriesCardProps {
  series: Series;
}

export default function SeriesCard({ series }: SeriesCardProps) {
  const navigate = useNavigate();
  const imageUrl = series.cover_image_url || series.carousel_image_url || series.hero_image_url;

  return (
    <div
      onClick={() => navigate(`/series-info/${series.id}`)}
      className="group relative flex-shrink-0 w-40 md:w-52 cursor-pointer"
    >
      <div
        className="relative aspect-[2/3] rounded-xl overflow-hidden border border-red-600/20 transition-all duration-300 group-hover:border-red-600/50 group-hover:shadow-lg group-hover:shadow-red-600/20 group-hover:scale-[1.03]"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={series.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <Film className="w-10 h-10 text-gray-600" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium">
            View Series
          </div>
        </div>

        {series.episode_count != null && Number(series.episode_count) > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-xs text-gray-300">
            {series.episode_count} episodes
          </div>
        )}

        {series.content_rating && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 border border-white/20 rounded text-xs">
            {series.content_rating}
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium truncate">{series.title}</h3>
        {series.category_name && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{series.category_name}</p>
        )}
      </div>
    </div>
  );
}
