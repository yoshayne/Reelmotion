import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import {
  Film, Layers, Image, Users, Star, AlignLeft, Megaphone, BarChart2,
} from "lucide-react";

interface DashboardStats {
  videos: number;
  series: number;
  subscribers: number;
  abandoned: number;
  contestSubmissions: number;
}

export default function AdminDashboard() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    videos: 0, series: 0, subscribers: 0, abandoned: 0, contestSubmissions: 0,
  });

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    Promise.all([
      apiFetch("/api/admin/videos").then((r) => r.json() as Promise<unknown[]>),
      apiFetch("/api/admin/series").then((r) => r.json() as Promise<unknown[]>),
      apiFetch("/api/admin/subscribers").then((r) => r.json() as Promise<unknown[]>),
      apiFetch("/api/admin/abandoned-signups").then((r) => r.json() as Promise<unknown[]>),
      apiFetch("/api/admin/contest-submissions").then((r) => r.json() as Promise<unknown[]>),
    ]).then(([v, s, sub, ab, cs]) => {
      setStats({
        videos: v.length,
        series: s.length,
        subscribers: sub.length,
        abandoned: ab.length,
        contestSubmissions: cs.length,
      });
    });
  }, [isCreator]);

  const navItems = [
    { to: "/admin/videos", icon: Film, label: "Videos", count: stats.videos },
    { to: "/admin/series", icon: Layers, label: "Series", count: stats.series },
    { to: "/admin/carousel", icon: Image, label: "Carousel", count: null },
    { to: "/admin/brand-assets", icon: Star, label: "Brand Assets", count: null },
    { to: "/admin/subscribers", icon: Users, label: "Subscribers", count: stats.subscribers },
    { to: "/admin/abandoned", icon: BarChart2, label: "Abandoned Signups", count: stats.abandoned },
    { to: "/admin/contest-submissions", icon: AlignLeft, label: "Contest Submissions", count: stats.contestSubmissions },
    { to: "/admin/promo-popups", icon: Megaphone, label: "Promo Popups", count: null },
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
      <Navbar />
      <div
        className="max-w-4xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <h1 className="text-2xl font-black mb-8">Admin Dashboard</h1>

        <div className="grid sm:grid-cols-2 gap-4">
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
