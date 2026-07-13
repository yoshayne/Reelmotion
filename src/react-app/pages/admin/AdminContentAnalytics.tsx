import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import { getThumbnailUrl } from "@/react-app/utils/thumbnail";
import { ChevronLeft, Eye, Users, CheckCircle, Clock, TrendingDown } from "lucide-react";

interface VideoStat {
  videoId: number;
  title: string;
  slug: string;
  contentType: string;
  thumbnailUrl: string | null;
  muxPlaybackId: string | null;
  muxDuration: number | null;
  views: number;
  uniqueViewers: number;
  completionRate: number;
  watchHours: number;
}

interface SeriesStat {
  seriesId: number;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  episodeCount: number;
  views: number;
  uniqueViewers: number;
  completionRate: number;
  watchHours: number;
}

type Tab = "videos" | "series";
type SortKey = "views" | "uniqueViewers" | "completionRate" | "watchHours";

function StatBadge({ value, label, icon: Icon }: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-400">
      <Icon className="w-3 h-3 text-gray-500" />
      <span className="font-medium text-white">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function CompletionBar({ rate }: { rate: number }) {
  const color = rate >= 70 ? "#16a34a" : rate >= 40 ? "#ca8a04" : "#dc2626";
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{rate}%</span>
    </div>
  );
}

const SORT_LABELS: Record<SortKey, string> = {
  views: "Views",
  uniqueViewers: "Unique Viewers",
  completionRate: "Completion %",
  watchHours: "Watch Hours",
};

export default function AdminContentAnalytics() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("videos");
  const [sort, setSort] = useState<SortKey>("views");
  const [videos, setVideos] = useState<VideoStat[]>([]);
  const [series, setSeries] = useState<SeriesStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/analytics/content")
      .then(r => r.json() as Promise<{ videos: VideoStat[]; series: SeriesStat[] }>)
      .then(data => {
        setVideos(data.videos);
        setSeries(data.series);
      })
      .finally(() => setLoading(false));
  }, [isCreator]);

  const sortedVideos = [...videos].sort((a, b) => b[sort] - a[sort]);
  const sortedSeries = [...series].sort((a, b) => b[sort] - a[sort]);

  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const totalHours = videos.reduce((s, v) => s + v.watchHours, 0);
  const avgCompletion = videos.length > 0
    ? Math.round(videos.reduce((s, v) => s + v.completionRate, 0) / videos.length * 10) / 10
    : 0;

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className="max-w-5xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <div className="mb-6">
          <Link to="/admin" className="flex items-center gap-1 text-sm text-gray-500 hover:text-white mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-black">Content Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Per-video and per-series performance</p>
        </div>

        {/* Summary strip */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Total Video Views</p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black">{totalHours.toFixed(1)}h</p>
              <p className="text-xs text-gray-500 mt-1">Total Watch Hours</p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black">{avgCompletion}%</p>
              <p className="text-xs text-gray-500 mt-1">Avg Completion Rate</p>
            </div>
          </div>
        )}

        {/* Tabs + Sort */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {(["videos", "series"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "videos" ? "Videos" : "Series"}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">Sort by</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="bg-gray-900 border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-600"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-900/60 border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tab === "videos" ? (
          <div className="space-y-3">
            {sortedVideos.length === 0 && (
              <p className="text-center text-gray-500 py-16">No playback data yet.</p>
            )}
            {sortedVideos.map((v, i) => {
              const thumb = getThumbnailUrl(v.thumbnailUrl, v.muxPlaybackId, v.muxDuration);
              return (
                <div key={v.videoId} className="flex gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">#{i + 1}</span>
                  </div>
                  <div className="relative flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-gray-800">
                    {thumb && <img src={thumb} alt={v.title} className="w-full h-full object-cover" />}
                    {v.views === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{v.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{v.contentType}</p>
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">{v.watchHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <StatBadge value={v.views.toLocaleString()} label="views" icon={Eye} />
                      <StatBadge value={v.uniqueViewers.toLocaleString()} label="viewers" icon={Users} />
                      <StatBadge value={`${v.completionRate}%`} label="completed" icon={CheckCircle} />
                      <StatBadge value={`${v.watchHours.toFixed(1)}h`} label="watched" icon={Clock} />
                    </div>
                    <CompletionBar rate={v.completionRate} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSeries.length === 0 && (
              <p className="text-center text-gray-500 py-16">No playback data yet.</p>
            )}
            {sortedSeries.map((s, i) => (
              <div key={s.seriesId} className="flex gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">#{i + 1}</span>
                </div>
                <div className="flex-shrink-0 w-16 aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                  {s.coverImageUrl && (
                    <img src={s.coverImageUrl} alt={s.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.episodeCount} episodes</p>
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0">{s.watchHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    <StatBadge value={s.views.toLocaleString()} label="views" icon={Eye} />
                    <StatBadge value={s.uniqueViewers.toLocaleString()} label="viewers" icon={Users} />
                    <StatBadge value={`${s.completionRate}%`} label="completed" icon={CheckCircle} />
                    <StatBadge value={`${s.watchHours.toFixed(1)}h`} label="watched" icon={Clock} />
                  </div>
                  <CompletionBar rate={s.completionRate} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
