import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import {
  ChevronLeft, Plus, Pencil, Trash2, DollarSign, Clock,
  CheckCircle, AlertCircle, Play, X, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RightsHolder {
  id: number;
  name: string;
  email: string | null;
  payment_method: string | null;
  payment_details: string | null;
  notes: string | null;
  video_count: number;
  pending_amount: number;
  paid_amount: number;
}

interface VideoRight {
  id: number;
  video_id: number;
  video_title: string;
  content_type: string;
  series_title: string | null;
  rights_holder_id: number;
  rights_holder_name: string;
  royalty_percent: number;
}

interface Statement {
  id: number;
  period: string;
  rights_holder_id: number;
  rights_holder_name: string;
  rights_holder_email: string | null;
  payment_method: string | null;
  payment_details: string | null;
  video_id: number | null;
  video_title: string;
  watch_hours: number;
  watch_share_percent: number;
  revenue_pool: number;
  gross_amount: number;
  royalty_percent: number;
  net_amount: number;
  status: "pending" | "paid";
  paid_at: string | null;
  notes: string | null;
}

interface Period {
  period: string;
  total_owed: number;
  pending_count: number;
  paid_count: number;
}

interface Overview {
  revenuePool: number;
  totalWatchHours: number;
  pendingStatements: number;
  pendingAmount: number;
  paidStatements: number;
  paidAmount: number;
  contentBreakdown: {
    videoId: number;
    videoTitle: string;
    watchHours: number;
    watchSharePercent: number;
    estimatedRevenue: number;
  }[];
}

interface VideoOption { id: number; title: string; content_type: string; }
interface SeriesOption { id: number; title: string; }

type Tab = "overview" | "rights" | "statements";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currency(n: number) {
  return `$${n.toFixed(2)}`;
}

function Badge({ status }: { status: "pending" | "paid" }) {
  return status === "paid" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-600/20 text-emerald-400">
      <CheckCircle className="w-3 h-3" /> Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-600/20 text-yellow-400">
      <AlertCircle className="w-3 h-3" /> Pending
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminRoyalties() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  // Data
  const [overview, setOverview] = useState<Overview | null>(null);
  const [holders, setHolders] = useState<RightsHolder[]>([]);
  const [videoRights, setVideoRights] = useState<VideoRight[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Modals
  const [holderModal, setHolderModal] = useState<Partial<RightsHolder> | null>(null);
  const [rightsModal, setRightsModal] = useState(false);
  const [assignMode, setAssignMode] = useState<"video" | "series">("series");
  const [rightsForm, setRightsForm] = useState({ target_id: "", rights_holder_id: "", royalty_percent: "50" });
  const [calculating, setCalculating] = useState(false);
  const [calcPeriod, setCalcPeriod] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [expandedHolder, setExpandedHolder] = useState<number | null>(null);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  const loadAll = useCallback(async () => {
    if (!isCreator) return;
    setLoading(true);
    const [ov, h, vr, p, v, s] = await Promise.all([
      apiFetch("/api/admin/royalties/overview").then(r => r.json() as Promise<Overview>),
      apiFetch("/api/admin/rights-holders").then(r => r.json() as Promise<RightsHolder[]>),
      apiFetch("/api/admin/video-rights").then(r => r.json() as Promise<VideoRight[]>),
      apiFetch("/api/admin/royalties/periods").then(r => r.json() as Promise<Period[]>),
      apiFetch("/api/admin/videos").then(r => r.json() as Promise<VideoOption[]>),
      apiFetch("/api/admin/series").then(r => r.json() as Promise<SeriesOption[]>),
    ]);
    setOverview(ov);
    setHolders(h);
    setVideoRights(vr);
    setPeriods(p);
    setVideos(v);
    setSeriesList(s);
    if (p.length > 0 && !selectedPeriod) setSelectedPeriod(p[0].period);
    setLoading(false);
  }, [isCreator, selectedPeriod]);

  useEffect(() => { loadAll(); }, [isCreator]);

  useEffect(() => {
    if (!isCreator || !selectedPeriod) return;
    apiFetch(`/api/admin/royalties/statements?period=${selectedPeriod}`)
      .then(r => r.json() as Promise<Statement[]>)
      .then(setStatements);
  }, [isCreator, selectedPeriod]);

  // ── Rights Holder CRUD ──
  async function saveHolder() {
    if (!holderModal) return;
    const method = holderModal.id ? "PUT" : "POST";
    const url = holderModal.id ? `/api/admin/rights-holders/${holderModal.id}` : "/api/admin/rights-holders";
    await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(holderModal) });
    setHolderModal(null);
    loadAll();
  }

  async function deleteHolder(id: number) {
    if (!confirm("Delete this rights holder? This will also delete their statements.")) return;
    await apiFetch(`/api/admin/rights-holders/${id}`, { method: "DELETE" });
    loadAll();
  }

  // ── Video Rights ──
  async function saveVideoRight() {
    const payload = {
      rights_holder_id: Number(rightsForm.rights_holder_id),
      royalty_percent: Number(rightsForm.royalty_percent),
    };
    if (assignMode === "series") {
      const res = await apiFetch("/api/admin/video-rights/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, series_id: Number(rightsForm.target_id) }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        alert(err.error ?? "Failed to assign");
        return;
      }
    } else {
      await apiFetch("/api/admin/video-rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, video_id: Number(rightsForm.target_id) }),
      });
    }
    setRightsModal(false);
    setRightsForm({ target_id: "", rights_holder_id: "", royalty_percent: "50" });
    loadAll();
  }

  async function deleteVideoRight(id: number) {
    await apiFetch(`/api/admin/video-rights/${id}`, { method: "DELETE" });
    loadAll();
  }

  // ── Calculate ──
  async function calculate() {
    setCalculating(true);
    const res = await apiFetch("/api/admin/royalties/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period: calcPeriod }),
    });
    setCalculating(false);
    if (res.ok) {
      setSelectedPeriod(calcPeriod);
      setTab("statements");
      loadAll();
    } else {
      const err = await res.json() as { error: string };
      alert(err.error ?? "Failed to calculate");
    }
  }

  // ── Pay ──
  async function payStatement(id: number) {
    await apiFetch(`/api/admin/royalties/statements/${id}/pay`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    const updated = await apiFetch(`/api/admin/royalties/statements?period=${selectedPeriod}`)
      .then(r => r.json() as Promise<Statement[]>);
    setStatements(updated);
    loadAll();
  }

  async function payAll(period: string) {
    if (!confirm(`Mark all pending statements for ${period} as paid?`)) return;
    await apiFetch(`/api/admin/royalties/periods/${period}/pay-all`, { method: "PUT" });
    const updated = await apiFetch(`/api/admin/royalties/statements?period=${period}`)
      .then(r => r.json() as Promise<Statement[]>);
    setStatements(updated);
    loadAll();
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Revenue Overview" },
    { key: "rights", label: "Rights & Holders" },
    { key: "statements", label: "Statements" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className="max-w-5xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        {/* Header */}
        <div className="mb-6">
          <Link to="/admin" className="flex items-center gap-1 text-sm text-gray-500 hover:text-white mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-black">Royalty Engine</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue distribution & creator payouts</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-900/60 border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {tab === "overview" && overview && (
              <div className="space-y-8">
                {/* KPI strip */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Monthly Revenue Pool", value: currency(overview.revenuePool), icon: DollarSign, color: "text-emerald-400" },
                    { label: "Total Watch Hours", value: `${overview.totalWatchHours.toFixed(1)}h`, icon: Clock, color: "text-blue-400" },
                    { label: "Pending Payouts", value: currency(overview.pendingAmount), icon: AlertCircle, color: "text-yellow-400" },
                    { label: "Paid Out (All Time)", value: currency(overview.paidAmount), icon: CheckCircle, color: "text-emerald-400" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
                      <p className="text-xs text-gray-500 mb-2">{label}</p>
                      <div className="flex items-end justify-between">
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <Icon className={`w-5 h-5 ${color} opacity-60`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculate new period */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                  <h2 className="font-bold mb-1">Generate Statements</h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Calculates royalties for each rights holder based on their content's
                    share of total watch hours for the selected month.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="month"
                      value={calcPeriod}
                      onChange={e => setCalcPeriod(e.target.value)}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                    />
                    <button
                      onClick={calculate}
                      disabled={calculating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      {calculating ? "Calculating…" : "Calculate & Generate"}
                    </button>
                  </div>
                </div>

                {/* Content breakdown */}
                <div>
                  <h2 className="font-bold mb-1">Revenue Distribution</h2>
                  <p className="text-xs text-gray-500 mb-4">
                    How this month's pool distributes across rights-assigned content by watch share
                  </p>
                  {overview.contentBreakdown.length === 0 ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                      <p className="text-gray-500 text-sm">No rights-assigned content yet.</p>
                      <p className="text-gray-600 text-xs mt-1">
                        Go to Rights & Holders to assign royalty percentages to videos.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {overview.contentBreakdown.map(item => (
                        <div key={item.videoId} className="flex items-center gap-4 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                          <Play className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.videoTitle}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-600 rounded-full"
                                  style={{ width: `${Math.min(item.watchSharePercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0">{item.watchSharePercent}%</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-emerald-400">{currency(item.estimatedRevenue)}</p>
                            <p className="text-xs text-gray-600">{item.watchHours.toFixed(1)}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RIGHTS & HOLDERS TAB ── */}
            {tab === "rights" && (
              <div className="space-y-8">
                {/* Rights Holders */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold">Rights Holders</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Filmmakers and creators who receive royalties</p>
                    </div>
                    <button
                      onClick={() => setHolderModal({})}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Holder
                    </button>
                  </div>

                  {holders.length === 0 ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                      <p className="text-gray-500 text-sm">No rights holders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {holders.map(h => (
                        <div key={h.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                          <button
                            className="w-full flex items-center gap-4 p-4 text-left"
                            onClick={() => setExpandedHolder(expandedHolder === h.id ? null : h.id)}
                          >
                            <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-red-400 font-bold text-sm">{h.name[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{h.name}</p>
                              <p className="text-xs text-gray-500 truncate">{h.email ?? "No email"} · {h.video_count} video{h.video_count !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="text-right flex-shrink-0 mr-2">
                              <p className="text-xs text-yellow-400">{currency(h.pending_amount)} pending</p>
                              <p className="text-xs text-gray-500">{currency(h.paid_amount)} paid</p>
                            </div>
                            {expandedHolder === h.id
                              ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                          </button>

                          {expandedHolder === h.id && (
                            <div className="border-t border-gray-800 p-4 space-y-3">
                              {h.payment_method && (
                                <div>
                                  <p className="text-xs text-gray-500">Payment Method</p>
                                  <p className="text-sm">{h.payment_method}</p>
                                </div>
                              )}
                              {h.payment_details && (
                                <div>
                                  <p className="text-xs text-gray-500">Payment Details</p>
                                  <p className="text-sm font-mono bg-gray-800 rounded px-2 py-1">{h.payment_details}</p>
                                </div>
                              )}
                              {h.notes && (
                                <div>
                                  <p className="text-xs text-gray-500">Notes</p>
                                  <p className="text-sm text-gray-400">{h.notes}</p>
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => setHolderModal(h)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 hover:border-gray-500 rounded-lg text-xs transition-colors"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => deleteHolder(h.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-900/50 hover:border-red-600 text-red-500 rounded-lg text-xs transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Rights */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold">Video Rights Assignments</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Which content earns royalties and at what rate</p>
                    </div>
                    <button
                      onClick={() => setRightsModal(true)}
                      disabled={holders.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Assign
                    </button>
                  </div>

                  {videoRights.length === 0 ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                      <p className="text-gray-500 text-sm">No rights assigned yet.</p>
                      <p className="text-gray-600 text-xs mt-1">Add a rights holder first, then assign them to a video.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {videoRights.map(vr => (
                        <div key={vr.id} className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                          <Play className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{vr.video_title}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {vr.series_title ? `${vr.series_title} · ` : ""}{vr.rights_holder_name}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-emerald-400 flex-shrink-0">
                            {vr.royalty_percent}%
                          </span>
                          <button
                            onClick={() => deleteVideoRight(vr.id)}
                            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STATEMENTS TAB ── */}
            {tab === "statements" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <select
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="">All periods</option>
                    {periods.map(p => (
                      <option key={p.period} value={p.period}>
                        {p.period} — {currency(p.total_owed)} ({p.pending_count} pending)
                      </option>
                    ))}
                  </select>

                  {selectedPeriod && statements.some(s => s.status === "pending") && (
                    <button
                      onClick={() => payAll(selectedPeriod)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark All Paid — {currency(statements.filter(s => s.status === "pending").reduce((a, s) => a + s.net_amount, 0))}
                    </button>
                  )}
                </div>

                {periods.length === 0 ? (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                    <p className="text-gray-500 text-sm">No statements generated yet.</p>
                    <p className="text-gray-600 text-xs mt-1">Go to Revenue Overview and generate statements for a period.</p>
                  </div>
                ) : statements.length === 0 ? (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
                    <p className="text-gray-500 text-sm">No statements for this period.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {statements.map(s => (
                      <div key={s.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{s.rights_holder_name}</p>
                              <Badge status={s.status} />
                            </div>
                            <p className="text-sm text-gray-400 truncate mt-0.5">{s.video_title}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-500">
                              <span>{s.watch_hours.toFixed(2)}h watched</span>
                              <span>{s.watch_share_percent}% of pool</span>
                              <span>Pool: {currency(s.revenue_pool)}</span>
                              <span>Gross: {currency(s.gross_amount)}</span>
                              <span>Rate: {s.royalty_percent}%</span>
                            </div>
                            {s.payment_method && (
                              <p className="text-xs text-gray-600 mt-1">
                                Pay via {s.payment_method}{s.payment_details ? `: ${s.payment_details}` : ""}
                              </p>
                            )}
                            {s.paid_at && (
                              <p className="text-xs text-gray-600 mt-0.5">
                                Paid {new Date(s.paid_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-black text-emerald-400">{currency(s.net_amount)}</p>
                            {s.status === "pending" && (
                              <button
                                onClick={() => payStatement(s.id)}
                                className="mt-2 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-medium transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Rights Holder Modal ── */}
      {holderModal !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{holderModal.id ? "Edit" : "Add"} Rights Holder</h2>
              <button onClick={() => setHolderModal(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: "name", label: "Name *", placeholder: "Director / Production Co." },
                { key: "email", label: "Email", placeholder: "payouts@example.com" },
                { key: "payment_method", label: "Payment Method", placeholder: "PayPal, ACH, Check…" },
                { key: "payment_details", label: "Payment Details", placeholder: "Account # / PayPal email" },
                { key: "notes", label: "Notes", placeholder: "Contract terms, split details…" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={(holderModal as Record<string, string | null>)[key] ?? ""}
                    onChange={e => setHolderModal(prev => ({ ...prev, [key]: e.target.value || null }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveHolder}
                disabled={!holderModal.name}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg font-medium text-sm transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setHolderModal(null)}
                className="px-4 py-2.5 border border-gray-700 rounded-lg text-sm transition-colors hover:border-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Rights Modal ── */}
      {rightsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Assign Rights</h2>
              <button onClick={() => setRightsModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-5">
              {(["series", "video"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setAssignMode(m); setRightsForm(f => ({ ...f, target_id: "" })); }}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    assignMode === m ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {m === "series" ? "Series (all episodes)" : "Single Video"}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  {assignMode === "series" ? "Series *" : "Video *"}
                </label>
                <select
                  value={rightsForm.target_id}
                  onChange={e => setRightsForm(f => ({ ...f, target_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="">Select {assignMode === "series" ? "a series" : "a video"}…</option>
                  {assignMode === "series"
                    ? seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)
                    : videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)
                  }
                </select>
                {assignMode === "series" && (
                  <p className="text-xs text-gray-600 mt-1">Assigns to all published episodes in the series</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Rights Holder *</label>
                <select
                  value={rightsForm.rights_holder_id}
                  onChange={e => setRightsForm(f => ({ ...f, rights_holder_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="">Select a rights holder…</option>
                  {holders.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Royalty % <span className="text-gray-600">(of this content's revenue share)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={rightsForm.royalty_percent}
                  onChange={e => setRightsForm(f => ({ ...f, royalty_percent: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveVideoRight}
                disabled={!rightsForm.target_id || !rightsForm.rights_holder_id}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg font-medium text-sm transition-colors"
              >
                {assignMode === "series" ? "Assign to All Episodes" : "Assign"}
              </button>
              <button
                onClick={() => setRightsModal(false)}
                className="px-4 py-2.5 border border-gray-700 rounded-lg text-sm transition-colors hover:border-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
