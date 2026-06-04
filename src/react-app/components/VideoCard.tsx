import { useNavigate } from "react-router";
import { Play, Lock, Info } from "lucide-react";
import type { Video } from "@/shared/types";

interface VideoCardProps {
  video: Video;
  hasAccess?: boolean;
  showProgress?: boolean;
}

export default function VideoCard({ video, hasAccess = false, showProgress = false }: VideoCardProps) {
  const navigate = useNavigate();

  const progress =
    showProgress && video.last_position_seconds && video.mux_duration
      ? Math.min((video.last_position_seconds / video.mux_duration) * 100, 100)
      : 0;

  const handleClick = () => {
    if (video.content_type === "movie" || video.content_type === "clip") {
      navigate(`/movie-info/${video.id}`);
    } else {
      navigate(`/watch/${video.id}`);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAccess || video.is_free) {
      navigate(`/watch/${video.id}`);
    } else {
      navigate("/subscribe");
    }
  };

  const imageUrl = video.thumbnail_url || video.carousel_image_url || video.hero_image_url;

  return (
    <div
      onClick={handleClick}
      className="group relative flex-shrink-0 w-40 md:w-52 cursor-pointer"
    >
      <div
        className="relative aspect-[2/3] rounded-xl overflow-hidden border border-red-600/20 transition-all duration-300 group-hover:border-red-600/50 group-hover:shadow-lg group-hover:shadow-red-600/20 group-hover:scale-[1.03]"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <Play className="w-10 h-10 text-gray-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={handlePlay}
            className="p-3 bg-white rounded-full hover:bg-gray-200 transition-colors"
          >
            {hasAccess || video.is_free ? (
              <Play className="w-5 h-5 text-black fill-black" />
            ) : (
              <Lock className="w-5 h-5 text-black" />
            )}
          </button>
          <button
            onClick={handleClick}
            className="p-3 bg-white/20 border border-white/30 rounded-full hover:bg-white/30 transition-colors"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Free badge */}
        {video.is_free && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 rounded text-xs font-bold">
            FREE
          </div>
        )}

        {/* Content rating */}
        {video.content_rating && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 border border-white/20 rounded text-xs">
            {video.content_rating}
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium truncate">{video.title}</h3>
        {video.series_title && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{video.series_title}</p>
        )}
        {video.content_type === "episode" && video.episode_number != null && (
          <p className="text-xs text-gray-500 mt-0.5">
            S{video.season_number ?? 1} E{video.episode_number}
          </p>
        )}
      </div>
    </div>
  );
}
