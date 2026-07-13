import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import { getThumbnailUrl } from "@/react-app/utils/thumbnail";
import { ChevronLeft, TrendingUp, Users, ArrowRight, Zap } from "lucide-react";

interface ConvertingContent {
  videoId: number;
  title: string;
  slug: string;
  contentType: string;
  seriesTitle: string | null;
  thumbnailUrl: string | null;
  muxPlaybackId: string | null;
  muxDuration: number | null;
  conversions: number;
  uniqueConverters: number;
}

interface TopOfFunnel {
  videoId: number;
  title: string;
  slug: string;
  contentType: string;
  thumbnailUrl: string | null;
  muxPlaybackId: string | null;
  muxDuration: number | null;
  freeViews: number;
  nonSubViewers: number;
}

interface Funnel {
  totalUsers: number;
  attempted: number;
  converted: number;
  abandoned: number;
  signupToAttemptRate: number;
  attemptToConvertRate: number;
  abandonRate: number;
}

interface AcquisitionData {
  convertingContent: ConvertingContent[];
  topOfFunnel: TopOfFunnel[];
  funnel: Funnel;
}

function FunnelStep({
  label, value, rate, rateLabel, color, isLast = false,
}: {
  label: string; value: number; rate?: number; rateLabel?: string;
  color: string; isLast?: boolean;
}) {
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: color }} />
        {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: color, opacity: 0.3 }} />}
      </div>
      <div className="pb-6 flex-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-black mt-0.5">{value.toLocaleString()}</p>
        {rate !== undefined && (
          <p className="text-xs mt-1" style={{ color }}>
            {rate}% {rateLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminAcquisitionAnalytics() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [data, setData] = useState<AcquisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"converting" | "funnel">("converting");

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/analytics/acquisition")
      .then(r => r.json() as Promise<AcquisitionData>)
      .then(setData)
      .finally(() => setLoading(false));
  }, [isCreator]);

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
          <h1 className="text-2xl font-black">Acquisition & Conversion</h1>
          <p className="text-gray-500 text-sm mt-1">What content drives subscriptions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit mb-8">
          <button
            onClick={() => setTab("converting")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "converting" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Converting Content
          </button>
          <button
            onClick={() => setTab("funnel")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "funnel" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Subscription Funnel
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-900/60 border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data ? null : tab === "converting" ? (
          <div className="space-y-8">
            {/* Converting content */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h2 className="font-bold">Content That Converts</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Videos watched within 7 days before a user subscribed
              </p>

              {data.convertingContent.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                  <p className="text-gray-500 text-sm">No attribution data yet.</p>
                  <p className="text-gray-600 text-xs mt-1">Data appears once users subscribe after watching content.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.convertingContent.map((v, i) => {
                    const thumb = getThumbnailUrl(v.thumbnailUrl, v.muxPlaybackId, v.muxDuration);
                    const maxConversions = data.convertingContent[0]?.conversions ?? 1;
                    const barWidth = Math.round((v.conversions / maxConversions) * 100);
                    return (
                      <div key={v.videoId} className="flex gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                        <div className="flex-shrink-0 w-8 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">#{i + 1}</span>
                        </div>
                        <div className="relative flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-gray-800">
                          {thumb && <img src={thumb} alt={v.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{v.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {v.seriesTitle ?? v.contentType}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-sm font-bold text-emerald-400">{v.conversions}</span>
                              <span className="text-xs text-gray-500">conversions</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-sm font-bold text-blue-300">{v.uniqueConverters}</span>
                              <span className="text-xs text-gray-500">subscribers</span>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top of funnel free content */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <h2 className="font-bold">Top-of-Funnel Free Content</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Free videos drawing the most non-subscriber viewers — conversion opportunities
              </p>

              {data.topOfFunnel.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                  <p className="text-gray-500 text-sm">No free content views from non-subscribers yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topOfFunnel.map((v, i) => {
                    const thumb = getThumbnailUrl(v.thumbnailUrl, v.muxPlaybackId, v.muxDuration);
                    const maxViews = data.topOfFunnel[0]?.freeViews ?? 1;
                    const barWidth = Math.round((v.freeViews / maxViews) * 100);
                    return (
                      <div key={v.videoId} className="flex gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                        <div className="flex-shrink-0 w-8 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">#{i + 1}</span>
                        </div>
                        <div className="relative flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-gray-800">
                          {thumb && <img src={thumb} alt={v.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{v.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{v.contentType} · Free</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white">{v.freeViews}</span>
                              <span className="text-xs text-gray-500">free views</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-sm font-bold text-purple-300">{v.nonSubViewers}</span>
                              <span className="text-xs text-gray-500">prospects</span>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Funnel tab */
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-bold mb-6">Subscription Funnel</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <FunnelStep
                  label="Total Accounts Created"
                  value={data.funnel.totalUsers}
                  color="#6b7280"
                />
                <FunnelStep
                  label="Started Checkout"
                  value={data.funnel.attempted}
                  rate={data.funnel.signupToAttemptRate}
                  rateLabel="of signups"
                  color="#3b82f6"
                />
                <FunnelStep
                  label="Abandoned Checkout"
                  value={data.funnel.abandoned}
                  rate={data.funnel.abandonRate}
                  rateLabel="abandon rate"
                  color="#f59e0b"
                />
                <FunnelStep
                  label="Active Subscribers"
                  value={data.funnel.converted}
                  rate={data.funnel.attemptToConvertRate}
                  rateLabel="checkout-to-paid"
                  color="#16a34a"
                  isLast
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-bold mb-2">Conversion Rates</h2>

              {[
                {
                  label: "Signup → Checkout",
                  value: data.funnel.signupToAttemptRate,
                  desc: "Users who started a subscription attempt",
                  color: "#3b82f6",
                },
                {
                  label: "Checkout → Paid",
                  value: data.funnel.attemptToConvertRate,
                  desc: "Checkout attempts that became active subs",
                  color: "#16a34a",
                },
                {
                  label: "Checkout Abandon Rate",
                  value: data.funnel.abandonRate,
                  desc: "Started checkout but did not complete",
                  color: "#f59e0b",
                },
              ].map(({ label, value, desc, color }) => (
                <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <p className="text-2xl font-black" style={{ color }}>{value}%</p>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}

              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4">
                <p className="text-xs text-yellow-400 font-medium">Opportunity</p>
                <p className="text-sm text-gray-300 mt-1">
                  {data.funnel.abandoned} users abandoned checkout. Consider a retargeting
                  email 24h after abandonment to recover these conversions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
