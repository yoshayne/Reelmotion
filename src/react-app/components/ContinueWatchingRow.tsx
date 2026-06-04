import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import type { PlaybackHistory } from "@/shared/types";

interface ContinueWatchingRowProps {
  items: PlaybackHistory[];
}

export default function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const navigate = useNavigate();

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -800 : 800, behavior: "smooth" });
    setTimeout(() => {
      if (!scrollRef.current) return;
      setShowLeft(scrollRef.current.scrollLeft > 0);
      setShowRight(
        scrollRef.current.scrollLeft <
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
      );
    }, 300);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (items.length === 0) return null;

  return (
    <div className="group/row">
      <div className="px-4 mb-3">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Continue Watching</h2>
        <div className="h-0.5 w-10 bg-red-600 mt-1.5" />
      </div>

      <div className="relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-black/90 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item) => {
            const progress =
              item.last_position_seconds && item.mux_duration
                ? Math.min((item.last_position_seconds / item.mux_duration) * 100, 100)
                : 0;

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/watch/${item.video_id}`)}
                className="group relative flex-shrink-0 w-56 md:w-72 cursor-pointer"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden border border-red-600/20 transition-all duration-300 group-hover:border-red-600/50 group-hover:shadow-lg group-hover:shadow-red-600/20">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-3 bg-white rounded-full">
                      <Play className="w-6 h-6 text-black fill-black" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div
                      className="h-full bg-red-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2 px-0.5">
                  <h3 className="text-sm font-medium truncate">{item.title}</h3>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.last_position_seconds)}</span>
                    {item.mux_duration && (
                      <span className="text-gray-500">/ {formatTime(item.mux_duration)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showRight && items.length > 2 && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-black/90 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
