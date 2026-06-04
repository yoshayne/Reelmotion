import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { Play, BookmarkPlus, BookmarkCheck, X } from "lucide-react";
import { apiFetch } from "@/react-app/utils/api";
import type { BrowseData, Video, Series, CarouselItem, PromoPopup } from "@/shared/types";

type TabType = "all" | "new" | "series" | "movies" | "clips";

export default function Browse() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [promoPopup, setPromoPopup] = useState<PromoPopup | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<number>>(new Set());
  const [heroIndex, setHeroIndex] = useState(0);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const heroIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/", { replace: true });
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/browse-data").then(r => r.json()),
      apiFetch("/api/promo-popup").then(r => r.json()).catch(() => null),
      apiFetch("/api/watchlist").then(r => r.json()).catch(() => ({ items: [] })),
      apiFetch("/api/playback-history").then(r => r.json()).catch(() => []),
    ]).then(([data, promo, wl, history]) => {
      setBrowseData(data);
      if (promo?.id) {
        setPromoPopup(promo);
        setShowPromo(true);
      }
      if (wl?.items) setWatchlist(new Set(wl.items.map((i: any) => i.video_id)));
      if (wl && Array.isArray(wl)) setWatchlist(new Set((wl as any[]).map((i: any) => i.video_id || i.id)));
      // Build continue watching from history + browse data videos
      if (Array.isArray(history) && Array.isArray(data?.videos)) {
        const cw = history
          .filter((h: any) => h.last_position_seconds > 5)
          .map((h: any) => {
            const video = data.videos.find((v: Video) => v.id === h.video_id);
            if (!video) return null;
            return { ...video, last_position_seconds: h.last_position_seconds };
          })
          .filter(Boolean)
          .slice(0, 10);
        setContinueWatching(cw);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Hero auto-rotate
  useEffect(() => {
    if (!browseData?.carousel?.length) return;
    heroIntervalRef.current = setInterval(() => setHeroIndex(i => (i + 1) % (browseData.carousel?.length ?? 1)), 5000);
    return () => { if (heroIntervalRef.current) clearInterval(heroIntervalRef.current); };
  }, [browseData]);

  const toggleWatchlist = async (videoId: number) => {
    const inList = watchlist.has(videoId);
    try {
      if (inList) {
        await apiFetch(`/api/watchlist/${videoId}`, { method: "DELETE" });
        setWatchlist(prev => { const n = new Set(prev); n.delete(videoId); return n; });
      } else {
        await apiFetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ video_id: videoId }) });
        setWatchlist(prev => new Set([...prev, videoId]));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: '#E8001D', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const hero: CarouselItem | undefined = browseData?.carousel?.[heroIndex];
  const allVideos: Video[] = browseData?.videos || [];
  const allSeries: Series[] = browseData?.series || [];

  const newVideos = allVideos.filter(v => {
    if (!v.created_at) return false;
    const d = new Date(v.created_at);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });
  const movies = allVideos.filter(v => v.content_type === "movie");
  const clips = allVideos.filter(v => v.content_type === "clip");

  // Use first 5 movies as "trending" for the trending section
  const trending = movies.slice(0, 5).length > 0 ? movies.slice(0, 5) : allVideos.slice(0, 5);

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "new", label: "NEW" },
    { id: "series", label: "SERIES" },
    { id: "movies", label: "MOVIES" },
    { id: "clips", label: "CLIPS" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed pointer-events-none" style={{ width: 220, height: 420, background: '#E8001D', opacity: 0.07, transform: 'rotate(18deg)', top: -60, right: -40, zIndex: 0 }} />

      {/* Promo Popup */}
      {showPromo && promoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowPromo(false)}>
          <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPromo(false)} className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-black rounded-full flex items-center justify-center border border-white/20">
              <X className="w-4 h-4" />
            </button>
            {promoPopup.image_key && (
              <img src={`/api/images/${promoPopup.image_key}`} alt={promoPopup.title} className="w-full rounded-xl" />
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ height: 280, paddingTop: 'max(env(safe-area-inset-top), 60px)' }}>
        {hero?.image_url && (
          <img src={hero.image_url} alt={hero.title} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }} />
        )}
        {/* Diagonal color split */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(125deg, rgba(232,0,29,0.85) 0%, rgba(139,0,16,0.85) 38%, transparent 38.5%)', zIndex: 1 }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: 'linear-gradient(to top, #000, transparent)', zIndex: 2 }} />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end pb-6 px-4" style={{ zIndex: 3 }}>
          {/* NOW TRENDING badge */}
          <div className="mb-2">
            <span className="text-white px-2 py-1 text-[9px] font-extrabold tracking-[0.2em] uppercase" style={{ backgroundColor: '#E8001D' }}>NOW TRENDING</span>
          </div>
          <h1 className="text-white font-black uppercase mb-3" style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            <span style={{ color: '#E8001D' }}>{(hero?.title || "Featured")[0]}</span>{(hero?.title || "Featured").slice(1)}
          </h1>
          {/* Parallelogram buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (hero?.video_id) navigate(`/watch/${hero.video_id}`);
                else if (hero?.series_id) navigate(`/series/${hero.series_id}`);
              }}
              style={{ transform: 'skewX(-8deg)', backgroundColor: '#E8001D', padding: '11px 20px' }}
            >
              <span className="flex items-center gap-2 font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(8deg)', display: 'block' }}>
                <Play className="w-3.5 h-3.5 inline" fill="currentColor" /> WATCH NOW
              </span>
            </button>
            <button
              onClick={() => hero?.video_id && toggleWatchlist(hero.video_id)}
              style={{ transform: 'skewX(-8deg)', border: '1px solid rgba(255,255,255,0.25)', padding: '11px 20px' }}
            >
              <span className="flex items-center gap-2 font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(8deg)', display: 'block' }}>
                {hero?.video_id && watchlist.has(hero.video_id) ? <BookmarkCheck className="w-3.5 h-3.5 inline" /> : <BookmarkPlus className="w-3.5 h-3.5 inline" />} LIST
              </span>
            </button>
          </div>
        </div>

        {/* Ghost rank number */}
        <span className="absolute top-16 right-4 select-none pointer-events-none font-black" style={{ fontSize: 130, fontWeight: 900, color: 'rgba(0,0,0,0.35)', WebkitTextStroke: '1px rgba(255,255,255,0.08)', zIndex: 2 }}>
          {heroIndex + 1}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 text-[11px] font-extrabold tracking-[0.12em] transition-colors"
            style={{
              borderRight: i < tabs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              color: activeTab === tab.id ? '#E8001D' : 'rgba(255,255,255,0.45)',
              borderBottom: activeTab === tab.id ? '2px solid #E8001D' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="pb-24 relative z-10">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div className="mt-5 mb-5">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>PICK UP WHERE YOU LEFT OFF</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Continue Watching</h2>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide px-4">
              <div className="flex" style={{ gap: 2 }}>
                {continueWatching.map((item: any) => (
                  <div key={item.id} onClick={() => navigate(`/watch/${item.id}`)} className="flex-shrink-0 cursor-pointer" style={{ width: 130 }}>
                    <div className="relative overflow-hidden" style={{ height: 80, clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}>
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900" />
                      )}
                      {/* Progress bar */}
                      {item.last_position_seconds && item.mux_duration && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                          <div className="h-full" style={{ width: `${Math.min(100, (item.last_position_seconds / item.mux_duration) * 100)}%`, backgroundColor: '#E8001D' }} />
                        </div>
                      )}
                      {/* Episode badge */}
                      {item.episode_number && (
                        <div className="absolute top-1 left-1 px-1 text-[9px] font-bold" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>E{item.episode_number}</div>
                      )}
                    </div>
                    <div className="px-1.5 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderLeft: '2px solid #E8001D' }}>
                      <p className="text-[10px] font-bold truncate">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trending section */}
        {(activeTab === "all" || activeTab === "movies") && trending.length > 0 && (
          <div className="mt-5 mb-6">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>TOP PICKS</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Trending</h2>
              </div>
            </div>
            <div className="px-4">
              <div className="flex gap-2">
                {trending.slice(0, 5).map((video: Video, index: number) => (
                  <div key={video.id} onClick={() => navigate(`/watch/${video.id}`)} className="relative cursor-pointer flex-shrink-0" style={{ width: 'calc((100% - 40px) / 5)' }}>
                    <div className="relative aspect-[2/3] overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900" />
                      )}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
                    </div>
                    {/* Ghost rank */}
                    <span className="absolute bottom-4 right-1 font-black select-none pointer-events-none" style={{ fontSize: 48, fontWeight: 900, color: 'rgba(0,0,0,0.35)', WebkitTextStroke: '1px rgba(255,255,255,0.08)', lineHeight: 1 }}>
                      {index + 1}
                    </span>
                    {/* Red play circle */}
                    <div className="absolute bottom-2 left-2 flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(232,0,29,0.9)' }}>
                      <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Series section */}
        {(activeTab === "all" || activeTab === "series") && allSeries.length > 0 && (
          <div className="mt-5 mb-6">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>EXPLORE</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Series</h2>
              </div>
              <button onClick={() => setActiveTab("series")} style={{ color: '#E8001D', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>SEE ALL</button>
            </div>
            <div className="overflow-x-auto scrollbar-hide px-4">
              <div className="flex gap-2">
                {allSeries.slice(0, 10).map((s: Series) => (
                  <div key={s.id} onClick={() => navigate(`/series/${s.id}`)} className="flex-shrink-0 cursor-pointer" style={{ width: 130 }}>
                    <div className="relative overflow-hidden aspect-[2/3]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                      {s.cover_image_url ? (
                        <img src={s.cover_image_url} alt={s.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                          <Play className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-bold mt-1 truncate">{s.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Movies section */}
        {(activeTab === "all" || activeTab === "movies") && movies.length > 0 && (
          <div className="mt-5 mb-6">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>WATCH NOW</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Movies</h2>
              </div>
              <button onClick={() => setActiveTab("movies")} style={{ color: '#E8001D', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>SEE ALL</button>
            </div>
            <div className="overflow-x-auto scrollbar-hide px-4">
              <div className="flex gap-2">
                {movies.slice(0, 10).map((v: Video) => (
                  <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="flex-shrink-0 cursor-pointer" style={{ width: 130 }}>
                    <div className="relative overflow-hidden aspect-[2/3]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900" />
                      )}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                      <div className="absolute bottom-2 left-2 flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(232,0,29,0.9)' }}>
                        <Play className="w-2.5 h-2.5 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold mt-1 truncate">{v.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New section */}
        {(activeTab === "all" || activeTab === "new") && newVideos.length > 0 && (
          <div className="mt-5 mb-6">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>JUST DROPPED</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>New</h2>
              </div>
              <button onClick={() => setActiveTab("new")} style={{ color: '#E8001D', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>SEE ALL</button>
            </div>
            <div className="overflow-x-auto scrollbar-hide px-4">
              <div className="flex gap-2">
                {newVideos.slice(0, 10).map((v: Video) => (
                  <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="flex-shrink-0 cursor-pointer" style={{ width: 130 }}>
                    <div className="relative overflow-hidden aspect-[2/3]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900" />
                      )}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest" style={{ backgroundColor: '#E8001D' }}>NEW</div>
                    </div>
                    <p className="text-[11px] font-bold mt-1 truncate">{v.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clips section */}
        {(activeTab === "all" || activeTab === "clips") && clips.length > 0 && (
          <div className="mt-5 mb-6">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>SHORT FORM</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Clips</h2>
              </div>
              <button onClick={() => setActiveTab("clips")} style={{ color: '#E8001D', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>SEE ALL</button>
            </div>
            <div className="overflow-x-auto scrollbar-hide px-4">
              <div className="flex gap-2">
                {clips.slice(0, 10).map((v: Video) => (
                  <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="flex-shrink-0 cursor-pointer" style={{ width: 130 }}>
                    <div className="relative overflow-hidden aspect-[9/16]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900" />
                      )}
                    </div>
                    <p className="text-[11px] font-bold mt-1 truncate">{v.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 px-4 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <img
            src="https://019af3d1-a2f2-7505-8523-8b0f9dcff281.mochausercontent.com/Watch-the-culture-tag.png"
            alt="Watch The Culture"
            className="h-4 object-contain"
            style={{ opacity: 0.4 }}
          />
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    </div>
  );
}
