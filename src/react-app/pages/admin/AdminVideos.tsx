import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import type { Video } from "@/shared/types";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

export default function AdminVideos() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/videos")
      .then((r) => r.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [isCreator]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this video?")) return;
    await apiFetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const filtered = videos.filter(
    (v) =>
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.content_type.includes(search.toLowerCase())
  );

  if (isChecking || loading) {
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-400">← Admin</Link>
            <h1 className="text-2xl font-black mt-1">Videos</h1>
          </div>
          <Link
            to="/admin/videos/new"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Video
          </Link>
        </div>

        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-red-600 transition-colors"
        />

        <div className="space-y-2">
          {filtered.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="w-16 aspect-video rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                {v.thumbnail_url && (
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{v.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 capitalize">{v.content_type}</span>
                  {v.series_title && (
                    <span className="text-xs text-gray-600">• {v.series_title}</span>
                  )}
                  {v.is_published ? (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Eye className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <EyeOff className="w-3 h-3" /> Draft
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/admin/videos/${v.id}`}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-12 text-gray-500">No videos found</p>
          )}
        </div>
      </div>
    </div>
  );
}
