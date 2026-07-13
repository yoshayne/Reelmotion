import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import {
  Film, Layers, Image, Users, Star, AlignLeft, Megaphone, BarChart2, MessageSquare,
  TrendingUp, DollarSign, Clock, Play, UserPlus, Activity, PieChart, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

interface KPIs {
  totalSubscribers: number;
  activeSubscribers: number;
  newSubscribersThisMonth: number;
  newSignupsThisMonth: number;
  mrr: number;
  arr: number;
  totalWatchHours: number;
  avgWatchMinutes: number;
  totalVideos: number;
  totalSeries: number;
  churnRate: number;
}

interface Charts {
  subscriberChart: { date: string; monthly: number; yearly: number; revenue: number }[];
  signupsChart: { date: string; signups: number }[];
  watchChart: { date: string; hours: number }[];
}

function fmt(n: number, decimals = 0) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(decimals);
}

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${Number(m)}/${Number(day)}`;
}

function KPICard({
  label, value, sub, icon: Icon, color = "red",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "red" | "green" | "blue" | "purple";
}) {
  const colors = {
    red: "bg-red-600/10 text-red-500",
    green: "bg-emerald-600/10 text-emerald-500",
    blue: "bg-blue-600/10 text-blue-500",
    purple: "bg-purple-600/10 text-purple-500",
  };
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#111",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

export default function AdminDashboard() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/analytics/kpis")
      .then(r => r.json() as Promise<KPIs>)
      .then(setKpis)
      .finally(() => setLoadingKpis(false));
    apiFetch("/api/admin/analytics/charts")
      .then(r => r.json() as Promise<Charts>)
      .then(setCharts)
      .finally(() => setLoadingCharts(false));
  }, [isCreator]);

  const navItems = [
    { to: "/admin/analytics/content", icon: PieChart, label: "Content Analytics", count: null },
    { to: "/admin/analytics/acquisition", icon: Target, label: "Acquisition & Conversion", count: null },
    { to: "/admin/videos", icon: Film, label: "Videos", count: kpis?.totalVideos },
    { to: "/admin/series", icon: Layers, label: "Series", count: kpis?.totalSeries },
    { to: "/admin/carousel", icon: Image, label: "Carousel", count: null },
    { to: "/admin/brand-assets", icon: Star, label: "Brand Assets", count: null },
    { to: "/admin/subscribers", icon: Users, label: "Subscribers", count: kpis?.activeSubscribers },
    { to: "/admin/abandoned", icon: BarChart2, label: "Abandoned Signups", count: null },
    { to: "/admin/contest-submissions", icon: AlignLeft, label: "Contest Submissions", count: null },
    { to: "/admin/promo-popups", icon: Megaphone, label: "Promo Popups", count: null },
    { to: "/admin/comments", icon: MessageSquare, label: "Comments", count: null },
  ];

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
        className="max-w-6xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-black">ReelMotion Insights</h1>
          <p className="text-gray-500 text-sm mt-1">Last 30 days · Live data</p>
        </div>

        {/* KPI Cards */}
        {loadingKpis ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : kpis && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <KPICard
              label="Active Subscribers"
              value={String(kpis.activeSubscribers)}
              sub={`+${kpis.newSubscribersThisMonth} this month`}
              icon={Users}
              color="red"
            />
            <KPICard
              label="Monthly Revenue (MRR)"
              value={`$${fmt(kpis.mrr, 2)}`}
              sub={`ARR $${fmt(kpis.arr, 2)}`}
              icon={DollarSign}
              color="green"
            />
            <KPICard
              label="Total Watch Hours"
              value={fmt(kpis.totalWatchHours, 1)}
              sub={`Avg ${kpis.avgWatchMinutes.toFixed(1)} min / session`}
              icon={Clock}
              color="blue"
            />
            <KPICard
              label="New Signups This Month"
              value={String(kpis.newSignupsThisMonth)}
              sub={`Churn rate ${kpis.churnRate}%`}
              icon={UserPlus}
              color="purple"
            />
            <KPICard
              label="Total Subscribers (All Time)"
              value={String(kpis.totalSubscribers)}
              icon={TrendingUp}
              color="green"
            />
            <KPICard
              label="Annual Run Rate"
              value={`$${fmt(kpis.arr, 0)}`}
              sub="Based on active plans"
              icon={Activity}
              color="red"
            />
            <KPICard
              label="Published Videos"
              value={String(kpis.totalVideos)}
              icon={Play}
              color="blue"
            />
            <KPICard
              label="Series"
              value={String(kpis.totalSeries)}
              icon={Layers}
              color="purple"
            />
          </div>
        )}

        {/* Charts */}
        {loadingCharts ? (
          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 h-64 animate-pulse" />
            ))}
          </div>
        ) : charts && (
          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            {/* Revenue Chart */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 lg:col-span-2">
              <h2 className="font-bold mb-1">Revenue (Last 30 Days)</h2>
              <p className="text-xs text-gray-500 mb-4">Daily new subscription revenue</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={charts.subscriberChart.map(d => ({ ...d, date: fmtDate(d.date) }))}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Subscriber Growth */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
              <h2 className="font-bold mb-1">New Subscribers</h2>
              <p className="text-xs text-gray-500 mb-4">Monthly vs yearly plans</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.subscriberChart.map(d => ({ ...d, date: fmtDate(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="monthly" name="Monthly" fill="#dc2626" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="yearly" name="Yearly" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Watch Hours */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
              <h2 className="font-bold mb-1">Watch Hours</h2>
              <p className="text-xs text-gray-500 mb-4">Hours streamed per day</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts.watchChart.map(d => ({ ...d, date: fmtDate(d.date) }))}>
                  <defs>
                    <linearGradient id="watchGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toFixed(1)}h`, "Hours"]} />
                  <Area type="monotone" dataKey="hours" stroke="#2563eb" fill="url(#watchGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* New Signups */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 lg:col-span-2">
              <h2 className="font-bold mb-1">New Account Signups</h2>
              <p className="text-xs text-gray-500 mb-4">Users who created an account (free + paid)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={charts.signupsChart.map(d => ({ ...d, date: fmtDate(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="signups" name="Signups" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Admin Nav */}
        <div className="mb-4">
          <h2 className="text-lg font-bold">Manage</h2>
          <div className="h-0.5 w-8 bg-red-600 mt-1.5 mb-4" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navItems.map(({ to, icon: Icon, label, count }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 p-5 bg-gray-900/50 border border-gray-800 hover:border-red-600/40 rounded-xl transition-all group"
            >
              <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:bg-red-600/20 transition-colors">
                <Icon className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{label}</p>
                {count != null && (
                  <p className="text-sm text-gray-500">{count} records</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
