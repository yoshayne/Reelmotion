import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VideoCard from "./VideoCard";
import type { Video } from "@/shared/types";

interface VideoRowProps {
  title: string;
  videos: Video[];
  hasAccess?: boolean;
  accentColor?: string;
}

export default function VideoRow({
  title,
  videos,
  hasAccess = false,
  accentColor = "red",
}: VideoRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

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

  if (videos.length === 0) return null;

  const accentClass = accentColor === "red" ? "bg-red-600" : "bg-purple-600";

  return (
    <div className="group/row">
      <div className="px-4 mb-3">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        <div className={`h-0.5 w-10 ${accentClass} mt-1.5`} />
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
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} hasAccess={hasAccess} />
          ))}
        </div>

        {showRight && videos.length > 3 && (
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
