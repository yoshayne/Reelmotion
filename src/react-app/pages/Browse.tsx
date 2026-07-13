import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { Play, BookmarkPlus, BookmarkCheck, X } from "lucide-react";
import { apiFetch } from "@/react-app/utils/api";
import { getThumbnailUrl } from "@/react-app/utils/thumbnail";
import type { BrowseData, Video, Series, CarouselItem, PromoPopup } from "@/shared/types";
import { useBrandAssets } from "@/react-app/hooks/useBrandAssets";

type TabType = "all" | "new" | "series" | "movies" | "clips";

export default function Browse() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [promoPopup, setPromoPopup] = useState<PromoPopup | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<number>>(new Set());
  const [heroIndex, setHeroIndex] = useState(0);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const heroIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { tagline } = useBrandAssets();

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/", { replace: true });
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    // Wait for Clerk to finish loading before fetching auth-gated endpoints.
    // Without this, apiFetch sends no token, gets 401, and catches return [].
    if (!isLoaded) return;

    // Reset user-specific state before fetching so stale data from a previous
    // session never bleeds through when a different user logs in
    setContinueWatching([]);
    setWatchlist(new Set());

    Promise.all([
      apiFetch("/api/browse-data").then(r => r.json()),
      apiFetch("/api/promo-popup").then(r => r.json()).catch(() => null),
      isSignedIn ? apiFetch("/api/watchlist").then(r => r.json()).catch(() => []) : Promise.resolve([]),
      isSignedIn ? apiFetch("/api/playback-history").then(r => r.json()).catch(() => []) : Promise.resolve([]),
    ]).then(([data, promo, wl, history]) => {
      setBrowseData(data);
      if (promo?.id) {
        setPromoPopup(promo);
        const key = `promo_seen_${promo.id}`;
        const lastSeen = localStorage.getItem(key);
        let shouldShow = false;
        if (promo.frequency === "always") {
          shouldShow = true;
        } else if (promo.frequency === "once_ever") {
          shouldShow = !lastSeen;
        } else {
          // once_per_day — check if last seen was before today
          const today = new Date().toDateString();
          shouldShow = lastSeen !== today;
        }
        if (shouldShow) setShowPromo(true);
      }
      if (Array.isArray(wl)) setWatchlist(new Set((wl as any[]).map((i: any) => i.video_id || i.id)));
      if (Array.isArray(history) && history.length > 0) {
        setContinueWatching(history.slice(0, 10));
      }
    }).catch(console.error).finally(() => setLoading(false));
  // user.id ensures a re-login by a different account refetches the correct data
  }, [isLoaded, isSignedIn, user?.id]);

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

  const sortFreeFirst = (arr: Video[]) =>
    [...arr].sort((a, b) => (b.is_free ? 1 : 0) - (a.is_free ? 1 : 0));

  const rawNewVideos = allVideos.filter(v => {
    if (!v.created_at) return false;
    return (Date.now() - new Date(v.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  });

  // Build deduplicated "new" cards:
  // - Episodes with a series_id → show the series poster once, navigate to series page
  // - Movies / clips / standalone episodes → show as-is
  type NewCard =
    | { kind: "series"; series: Series; isFree: boolean }
    | { kind: "video"; video: Video };

  const newCards: NewCard[] = (() => {
    const seenSeriesIds = new Set<number>();
    const cards: NewCard[] = [];
    const seriesMap = new Map(allSeries.map(s => [s.id, s]));
    for (const v of rawNewVideos) {
      if (v.series_id && v.content_type === "episode") {
        if (!seenSeriesIds.has(v.series_id)) {
          const series = seriesMap.get(v.series_id);
          if (series) {
            seenSeriesIds.add(v.series_id);
            cards.push({ kind: "series", series, isFree: v.is_free });
          } else {
            cards.push({ kind: "video", video: v });
          }
        }
      } else {
        cards.push({ kind: "video", video: v });
      }
    }
    return cards;
  })();
  const movies = sortFreeFirst(allVideos.filter(v => v.content_type === "movie"));
  const clips = sortFreeFirst(allVideos.filter(v => v.content_type === "clip"));

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "new", label: "NEW" },
    { id: "series", label: "SERIES" },
    { id: "movies", label: "MOVIES" },
    { id: "clips", label: "CLIPS" },
  ];

  // Shared horizontal scroll row
  function ScrollRow({ children }: { children: React.ReactNode }) {
    return (
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4" style={{ paddingRight: 16 }}>
          {children}
        </div>
      </div>
    );
  }

  // Section heading
  function SectionHead({ eyebrow, title, onSeeAll }: { eyebrow: string; title: string; onSeeAll?: () => void }) {
    return (
      <div className="px-4 mb-3 flex items-end justify-between">
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{eyebrow}</p>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1 }}>{title}</h2>
        </div>
        {onSeeAll && (
          <button onClick={onSeeAll} style={{ color: '#E8001D', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', paddingBottom: 2 }}>SEE ALL</button>
        )}
      </div>
    );
  }

  // Poster card (2:3 aspect ratio)
  function PosterCard({ image, muxPlaybackId, muxDuration, title, onClick, badge }: { image?: string | null; muxPlaybackId?: string | null; muxDuration?: number | null; title: string; onClick: () => void; badge?: React.ReactNode }) {
    const imgSrc = getThumbnailUrl(image, muxPlaybackId, muxDuration);
    return (
      <div onClick={onClick} className="flex-shrink-0 cursor-pointer" style={{ width: 160 }}>
        <div className="relative overflow-hidden" style={{ aspectRatio: '2/3', clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <Play className="w-8 h-8 text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 45%)' }} />
          {badge && <div className="absolute top-2 left-2">{badge}</div>}
          <div className="absolute bottom-2 left-2 flex items-center justify-center" style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'rgba(232,0,29,0.9)' }}>
            <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
          </div>
        </div>
        <p className="text-[12px] font-semibold mt-1.5 truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed pointer-events-none" style={{ width: 220, height: 420, background: '#E8001D', opacity: 0.07, transform: 'rotate(18deg)', top: -60, right: -40, zIndex: 0 }} />

      {/* Promo Popup */}
      {showPromo && promoPopup && (() => {
        const markSeen = () => {
          const key = `promo_seen_${promoPopup.id}`;
          localStorage.setItem(key, new Date().toDateString());
        };
        const handlePromoClick = () => {
          markSeen();
          setShowPromo(false);
          if (promoPopup.link_type === "video" && promoPopup.link_video_id) {
            navigate(`/watch/${promoPopup.link_video_id}`);
          } else if (promoPopup.link_type === "series" && promoPopup.link_series_id) {
            navigate(`/series/${promoPopup.link_series_id}`);
          } else if (promoPopup.link_type === "custom" && promoPopup.link_custom_url) {
            window.open(promoPopup.link_custom_url, "_blank", "noopener");
          }
        };
        const hasLink = !!(promoPopup.link_type && (
          promoPopup.link_video_id || promoPopup.link_series_id || promoPopup.link_custom_url
        ));
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => { markSeen(); setShowPromo(false); }}>
            <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <button onClick={() => { markSeen(); setShowPromo(false); }} className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-black rounded-full flex items-center justify-center border border-white/20">
                <X className="w-4 h-4" />
              </button>
              {promoPopup.image_key && (
                <img
                  src={`/api/images/${encodeURIComponent(promoPopup.image_key)}`}
                  alt={promoPopup.title}
                  onClick={hasLink ? handlePromoClick : undefined}
                  className={`w-full rounded-xl block${hasLink ? " cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ height: 380, marginTop: 56 }}>
        {hero?.image_url && (
          <img src={hero.image_url} alt={hero.title} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }} />
        )}
        {/* Dark vignette so text is always readable */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 100%)', zIndex: 1 }} />
        {/* Diagonal red accent on left */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(125deg, rgba(232,0,29,0.55) 0%, transparent 42%)', zIndex: 1 }} />

        {/* Content pinned to bottom-left with consistent margin */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6" style={{ zIndex: 3 }}>
          <div className="mb-2">
            <span className="text-white px-2 py-0.5 text-[9px] font-extrabold tracking-[0.2em] uppercase" style={{ backgroundColor: '#E8001D' }}>NOW TRENDING</span>
          </div>
          <h1 className="text-white font-black uppercase mb-3" style={{ fontSize: 34, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            <span style={{ color: '#E8001D' }}>{(hero?.title || "Featured")[0]}</span>{(hero?.title || "Featured").slice(1)}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (hero?.video_id) navigate(`/watch/${hero.video_id}`);
                else if (hero?.series_id) navigate(`/series/${hero.series_id}`);
              }}
              style={{ transform: 'skewX(-8deg)', backgroundColor: '#E8001D', padding: '11px 22px' }}
            >
              <span className="flex items-center gap-2 font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(8deg)', display: 'block' }}>
                <Play className="w-3.5 h-3.5 inline" fill="currentColor" /> WATCH NOW
              </span>
            </button>
            <button
              onClick={() => hero?.video_id && toggleWatchlist(hero.video_id)}
              style={{ transform: 'skewX(-8deg)', border: '1px solid rgba(255,255,255,0.3)', padding: '11px 22px' }}
            >
              <span className="flex items-center gap-2 font-extrabold text-xs tracking-[0.1em] uppercase" style={{ transform: 'skewX(8deg)', display: 'block' }}>
                {hero?.video_id && watchlist.has(hero.video_id) ? <BookmarkCheck className="w-3.5 h-3.5 inline" /> : <BookmarkPlus className="w-3.5 h-3.5 inline" />} LIST
              </span>
            </button>
          </div>
        </div>

        {/* Carousel dots */}
        {(browseData?.carousel?.length ?? 0) > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5" style={{ zIndex: 3 }}>
            {browseData!.carousel!.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                style={{ width: i === heroIndex ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === heroIndex ? '#E8001D' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
              />
            ))}
          </div>
        )}
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

      {/* Content */}
      <div className="pb-24 relative z-10">

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div className="mt-6 mb-2">
            <SectionHead eyebrow="PICK UP WHERE YOU LEFT OFF" title="Continue Watching" />
            <ScrollRow>
              {continueWatching.map((item: any) => (
                <div key={item.id} onClick={() => navigate(`/watch/${item.id}`)} className="flex-shrink-0 cursor-pointer" style={{ width: 180 }}>
                  <div className="relative overflow-hidden rounded" style={{ height: 102, clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)' }}>
                    {getThumbnailUrl(item.thumbnail_url, item.mux_playback_id, item.mux_duration) ? (
                      <img src={getThumbnailUrl(item.thumbnail_url, item.mux_playback_id, item.mux_duration)!} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900" />
                    )}
                    {item.last_position_seconds > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                        <div
                          className="h-full"
                          style={{
                            width: item.mux_duration > 0
                              ? `${Math.min(100, (item.last_position_seconds / item.mux_duration) * 100)}%`
                              : '30%',
                            backgroundColor: '#E8001D',
                          }}
                        />
                      </div>
                    )}
                    {item.episode_number && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 text-[9px] font-bold rounded" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>E{item.episode_number}</div>
                    )}
                  </div>
                  <div className="px-2 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderLeft: '2px solid #E8001D' }}>
                    <p className="text-[11px] font-bold truncate">{item.title}</p>
                  </div>
                </div>
              ))}
            </ScrollRow>
          </div>
        )}

        {/* Series section */}
        {(activeTab === "all" || activeTab === "series") && allSeries.length > 0 && (
          <div className="mt-7 mb-2">
            <SectionHead eyebrow="EXPLORE" title="Series" onSeeAll={() => setActiveTab("series")} />
            <ScrollRow>
              {allSeries.slice(0, 10).map((s: Series) => (
                <PosterCard
                  key={s.id}
                  image={s.cover_image_url}
                  title={s.title}
                  onClick={() => navigate(`/series/${s.id}`)}
                />
              ))}
            </ScrollRow>
          </div>
        )}

        {/* New section */}
        {(activeTab === "all" || activeTab === "new") && newCards.length > 0 && (
          <div className="mt-7 mb-2">
            <SectionHead eyebrow="JUST DROPPED" title="New" onSeeAll={() => setActiveTab("new")} />
            <ScrollRow>
              {newCards.slice(0, 10).map((card) => {
                if (card.kind === "series") {
                  return (
                    <PosterCard
                      key={`series-${card.series.id}`}
                      image={card.series.cover_image_url || card.series.carousel_image_url}
                      title={card.series.title}
                      onClick={() => navigate(`/series/${card.series.id}`)}
                      badge={
                        card.isFree
                          ? <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest bg-emerald-500 text-black">FREE</span>
                          : <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest" style={{ backgroundColor: '#E8001D' }}>NEW</span>
                      }
                    />
                  );
                }
                const v = card.video;
                return (
                  <PosterCard
                    key={`video-${v.id}`}
                    image={v.thumbnail_url}
                    muxPlaybackId={v.mux_playback_id}
                    muxDuration={v.mux_duration}
                    title={v.title}
                    onClick={() => navigate(v.content_type === "episode" ? `/watch/${v.id}` : `/movie-info/${v.id}`)}
                    badge={
                      v.is_free
                        ? <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest bg-emerald-500 text-black">FREE</span>
                        : <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest" style={{ backgroundColor: '#E8001D' }}>NEW</span>
                    }
                  />
                );
              })}
            </ScrollRow>
          </div>
        )}

        {/* Movies section */}
        {(activeTab === "all" || activeTab === "movies") && movies.length > 0 && (
          <div className="mt-7 mb-2">
            <SectionHead eyebrow="WATCH NOW" title="Movies" onSeeAll={() => setActiveTab("movies")} />
            <ScrollRow>
              {movies.slice(0, 10).map((v: Video) => (
                <PosterCard
                  key={v.id}
                  image={v.thumbnail_url}
                  muxPlaybackId={v.mux_playback_id}
                  muxDuration={v.mux_duration}
                  title={v.title}
                  onClick={() => navigate(`/watch/${v.id}`)}
                  badge={v.is_free ? <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest bg-emerald-500 text-black">FREE</span> : undefined}
                />
              ))}
            </ScrollRow>
          </div>
        )}

        {/* Clips section */}
        {(activeTab === "all" || activeTab === "clips") && clips.length > 0 && (
          <div className="mt-7 mb-2">
            <SectionHead eyebrow="SHORT FORM" title="Clips" onSeeAll={() => setActiveTab("clips")} />
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-4">
                {clips.slice(0, 10).map((v: Video) => (
                  <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="flex-shrink-0 cursor-pointer" style={{ width: 120 }}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: '9/16', clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                      {getThumbnailUrl(v.thumbnail_url, v.mux_playback_id, v.mux_duration) ? (
                        <img src={getThumbnailUrl(v.thumbnail_url, v.mux_playback_id, v.mux_duration)!} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900" />
                      )}
                      {v.is_free && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest bg-emerald-500 text-black">FREE</span>
                      )}
                    </div>
                    <p className="text-[12px] font-semibold mt-1.5 truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{v.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 px-4 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          {tagline ? (
            <img src={tagline} alt="Watch The Culture" className="h-4 object-contain" style={{ opacity: 0.4 }} />
          ) : (
            <span className="text-[10px] font-semibold tracking-widest uppercase text-white/25">Watch The Culture</span>
          )}
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    </div>
  );
}
