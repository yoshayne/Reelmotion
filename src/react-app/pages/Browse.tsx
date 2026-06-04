import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/react-app/components/Navbar";
import VideoRow from "@/react-app/components/VideoRow";
import SeriesRow from "@/react-app/components/SeriesRow";
import ContinueWatchingRow from "@/react-app/components/ContinueWatchingRow";
import ComingSoonRow from "@/react-app/components/ComingSoonRow";
import { RowSkeleton } from "@/react-app/components/Skeleton";
import { apiFetch } from "@/react-app/utils/api";
import { hasAccess } from "@/react-app/utils/access";
import type { BrowseData, PlaybackHistory, Subscription, Video, Series } from "@/shared/types";
import { ChevronLeft, ChevronRight, Play, Info, X } from "lucide-react";

export default function BrowsePage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [data, setData] = useState<BrowseData | null>(null);
  const [playbackHistory, setPlaybackHistory] = useState<PlaybackHistory[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [watchlist, setWatchlist] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [promoPopup, setPromoPopup] = useState<{
    id: number; title: string; image_key: string;
    link_type: string; link_video_id: number | null; link_series_id: number | null; link_custom_url: string | null;
  } | null>(null);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [browseRes, promoRes] = await Promise.all([
          fetch("/api/browse-data"),
          fetch("/api/promo-popup"),
        ]);
        const browseData = await browseRes.json() as BrowseData;
        const promo = await promoRes.json() as typeof promoPopup;
        setData(browseData);
        if (promo) {
          setPromoPopup(promo);
          const key = `promo-shown-${promo.id}-${new Date().toDateString()}`;
          if (!localStorage.getItem(key)) {
            setShowPromo(true);
            localStorage.setItem(key, "1");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      apiFetch("/api/playback-history").then((r) => r.json() as Promise<PlaybackHistory[]>),
      apiFetch("/api/billing/subscription").then((r) => r.json() as Promise<Subscription | null>),
      apiFetch("/api/watchlist").then((r) => r.json() as Promise<Video[]>),
    ])
      .then(([history, sub, wl]) => {
        setPlaybackHistory(history);
        setSubscription(sub);
        setWatchlist(wl);
      })
      .catch(console.error);
  }, [user, isLoaded]);

  const carousel = data?.carousel ?? [];

  useEffect(() => {
    if (carousel.length <= 1) return;
    const t = setInterval(() => setCarouselIndex((i) => (i + 1) % carousel.length), 5000);
    return () => clearInterval(t);
  }, [carousel.length]);

  const userHasAccess = hasAccess(subscription);

  const filteredVideos = useCallback((): Video[] => {
    if (!data) return [];
    return activeCategory === "all"
      ? data.videos
      : data.videos.filter((v) => v.category_id === activeCategory);
  }, [data, activeCategory]);

  const filteredSeries = useCallback((): Series[] => {
    if (!data) return [];
    return activeCategory === "all"
      ? data.series
      : data.series.filter((s) => s.category_id === activeCategory);
  }, [data, activeCategory]);

  const comingSoonVideos = filteredVideos()
    .filter((v) => v.release_date && new Date(v.release_date) > new Date())
    .map((v) => ({ ...v, item_type: "video" as const }));

  const comingSoonSeries = filteredSeries()
    .filter(
      (s) => s.release_date && new Date(s.release_date) > new Date()
    )
    .map((s) => ({ id: s.id, title: s.title, thumbnail_url: null, cover_image_url: s.cover_image_url, description: s.description, release_date: s.release_date!, item_type: "series" as const }));

  const comingSoon = [...comingSoonVideos, ...comingSoonSeries].sort(
    (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  );

  const movies = filteredVideos().filter(
    (v) => v.content_type === "movie" && !(v.release_date && new Date(v.release_date) > new Date())
  );
  const episodes = filteredVideos().filter(
    (v) => v.content_type === "episode" && !(v.release_date && new Date(v.release_date) > new Date())
  );
  const clips = filteredVideos().filter((v) => v.content_type === "clip");
  const seriesFiltered = filteredSeries().filter(
    (s) => !(s.release_date && new Date(s.release_date) > new Date())
  );

  const handlePromoClick = () => {
    if (!promoPopup) return;
    setShowPromo(false);
    if (promoPopup.link_type === "video" && promoPopup.link_video_id) {
      navigate(`/movie-info/${promoPopup.link_video_id}`);
    } else if (promoPopup.link_type === "series" && promoPopup.link_series_id) {
      navigate(`/series-info/${promoPopup.link_series_id}`);
    } else if (promoPopup.link_type === "custom" && promoPopup.link_custom_url) {
      window.open(promoPopup.link_custom_url, "_blank");
    }
  };

  const currentCarousel = carousel[carouselIndex];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Carousel */}
      <div className="relative h-[56vw] max-h-[600px] min-h-[300px] overflow-hidden">
        {loading ? (
          <div className="w-full h-full bg-gray-900 animate-pulse" />
        ) : currentCarousel ? (
          <>
            <img
              src={currentCarousel.image_url}
              alt={currentCarousel.title}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              key={currentCarousel.id}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-lg" style={{ paddingTop: "max(env(safe-area-inset-top), 80px)" }}>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
                {currentCarousel.title}
              </h1>
              {currentCarousel.description && (
                <p className="text-sm md:text-base text-gray-300 mb-5 line-clamp-2">
                  {currentCarousel.description}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (currentCarousel.video_id) navigate(`/watch/${currentCarousel.video_id}`);
                    else if (currentCarousel.series_id) navigate(`/series/${currentCarousel.series_id}`);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Play
                </button>
                <button
                  onClick={() => {
                    if (currentCarousel.video_id) navigate(`/movie-info/${currentCarousel.video_id}`);
                    else if (currentCarousel.series_id) navigate(`/series-info/${currentCarousel.series_id}`);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 font-medium rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Info className="w-4 h-4" />
                  More Info
                </button>
              </div>
            </div>

            {/* Carousel dots */}
            {carousel.length > 1 && (
              <div className="absolute bottom-4 right-4 md:right-8 flex gap-1.5">
                {carousel.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === carouselIndex ? "bg-white w-6" : "bg-white/40"}`}
                  />
                ))}
              </div>
            )}

            {carousel.length > 1 && (
              <>
                <button
                  onClick={() => setCarouselIndex((i) => (i - 1 + carousel.length) % carousel.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCarouselIndex((i) => (i + 1) % carousel.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        ) : null}
      </div>

      {/* Subscribe CTA for non-members */}
      {isLoaded && user && !userHasAccess && (
        <div className="mx-4 my-4 p-4 bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-600/30 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Join the Community</p>
            <p className="text-sm text-gray-400">Unlock all films with a membership</p>
          </div>
          <button
            onClick={() => navigate("/subscribe")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm flex-shrink-0 transition-colors"
          >
            Join Now
          </button>
        </div>
      )}

      {/* Category filter */}
      {data && data.categories.length > 0 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === "all" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
          >
            All
          </button>
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Content rows */}
      <div className="space-y-8 pb-16 pt-4">
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : (
          <>
            {user && playbackHistory.length > 0 && (
              <ContinueWatchingRow items={playbackHistory} />
            )}
            {user && watchlist.length > 0 && (
              <VideoRow title="My List" videos={watchlist} hasAccess={userHasAccess} />
            )}
            {movies.length > 0 && (
              <VideoRow title="Movies" videos={movies} hasAccess={userHasAccess} />
            )}
            {seriesFiltered.length > 0 && (
              <SeriesRow title="Series" seriesList={seriesFiltered} />
            )}
            {episodes.length > 0 && (
              <VideoRow title="Episodes" videos={episodes} hasAccess={userHasAccess} />
            )}
            {clips.length > 0 && (
              <VideoRow title="Clips" videos={clips} hasAccess={userHasAccess} />
            )}
            {comingSoon.length > 0 && (
              <ComingSoonRow items={comingSoon} />
            )}
            {movies.length === 0 && seriesFiltered.length === 0 && episodes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <p className="text-lg">No content found</p>
                {activeCategory !== "all" && (
                  <button
                    onClick={() => setActiveCategory("all")}
                    className="mt-3 text-red-500 hover:text-red-400 text-sm"
                  >
                    Show all categories
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Promo Popup */}
      {showPromo && promoPopup && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setShowPromo(false)}
              className="absolute -top-3 -right-3 z-10 p-1.5 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div
              onClick={handlePromoClick}
              className="cursor-pointer rounded-xl overflow-hidden border border-red-600/30 shadow-2xl shadow-red-600/20"
            >
              <img
                src={`/api/images/${encodeURIComponent(promoPopup.image_key)}`}
                alt={promoPopup.title}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
