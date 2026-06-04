import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import type { Series } from "@/shared/types";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function AdminSeries() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/series")
      .then((r) => r.json() as Promise<Series[]>)
      .then(setSeries)
      .finally(() => setLoading(false));
  }, [isCreator]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this series?")) return;
    await apiFetch(`/api/admin/series/${id}`, { method: "DELETE" });
    setSeries((prev) => prev.filter((s) => s.id !== id));
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-400">← Admin</Link>
            <h1 className="text-2xl font-black mt-1">Series</h1>
          </div>
          <Link to="/admin/series/new" className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Series
          </Link>
        </div>
        <div className="space-y-2">
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                {(s.cover_image_url || s.carousel_image_url) && (
                  <img src={(s.cover_image_url || s.carousel_image_url)!} alt={s.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.episode_count ?? 0} episodes</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/series/${s.id}`} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                  <Edit className="w-4 h-4" />
                </Link>
                <button onClick={() => handleDelete(s.id)} className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {series.length === 0 && <p className="text-center py-12 text-gray-500">No series yet</p>}
        </div>
      </div>
    </div>
  );
}
