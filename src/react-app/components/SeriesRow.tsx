import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SeriesCard from "./SeriesCard";
import type { Series } from "@/shared/types";

interface SeriesRowProps {
  title: string;
  seriesList: Series[];
}

export default function SeriesRow({ title, seriesList }: SeriesRowProps) {
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

  if (seriesList.length === 0) return null;

  return (
    <div className="group/row">
      <div className="px-4 mb-3">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
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
          {seriesList.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>

        {showRight && seriesList.length > 3 && (
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
