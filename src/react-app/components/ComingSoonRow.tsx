import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";

interface ComingSoonItem {
  id: number;
  title: string;
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  description: string | null;
  release_date: string;
  item_type: "video" | "series";
}

interface ComingSoonRowProps {
  items: ComingSoonItem[];
}

export default function ComingSoonRow({ items }: ComingSoonRowProps) {
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getCountdown = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff <= 0) return "Coming Soon";
    if (diff === 1) return "Tomorrow";
    if (diff <= 7) return `${diff} days`;
    if (diff <= 30) return `${Math.ceil(diff / 7)} weeks`;
    return formatDate(d);
  };

  const handleClick = (item: ComingSoonItem) => {
    if (item.item_type === "video") navigate(`/movie-info/${item.id}`);
    else navigate(`/series-info/${item.id}`);
  };

  if (items.length === 0) return null;

  return (
    <div className="group/row">
      <div className="px-4 mb-3 flex items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Coming Soon</h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-purple-300 font-medium">{items.length} upcoming</span>
        </div>
      </div>
      <div className="px-4 mb-3">
        <div className="h-0.5 w-10 bg-gradient-to-r from-purple-600 to-red-600" />
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
          {items.map((item) => (
            <div
              key={`${item.item_type}-${item.id}`}
              onClick={() => handleClick(item)}
              className="group relative flex-shrink-0 w-40 md:w-56 cursor-pointer"
            >
              <div
                className="relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-[1.03]"
                style={{
                  boxShadow: "0 0 18px rgba(147,51,234,0.3), 0 0 30px rgba(220,38,38,0.15)",
                  border: "1.5px solid rgba(147,51,234,0.4)",
                }}
              >
                {item.thumbnail_url || item.cover_image_url ? (
                  <img
                    src={(item.thumbnail_url || item.cover_image_url)!}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-black flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-purple-600" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-red-600 rounded text-xs font-bold shadow-lg">
                  COMING SOON
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    <span className="font-medium">{getCountdown(item.release_date)}</span>
                  </div>
                  <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-gray-300 capitalize">
                    {item.item_type}
                  </div>
                </div>

                <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-medium">
                    View Details
                  </div>
                </div>
              </div>

              <div className="mt-2 px-0.5">
                <h3 className="text-sm font-medium truncate">{item.title}</h3>
                <p className="text-xs text-purple-400 mt-0.5">{formatDate(item.release_date)}</p>
              </div>
            </div>
          ))}
        </div>

        {showRight && items.length > 3 && (
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
