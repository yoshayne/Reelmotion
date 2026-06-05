import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import { Trash2 } from "lucide-react";

interface AdminComment {
  id: number;
  body: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
  video_title: string;
  video_id: number;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminComments() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/comments")
      .then(r => r.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [isCreator]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this comment?")) return;
    await apiFetch(`/api/comments/${id}`, { method: "DELETE" });
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const filtered = comments.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.video_title.toLowerCase().includes(q) || (c.display_name ?? "").toLowerCase().includes(q);
  });

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <div className="mb-6">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-400">← Admin</Link>
          <h1 className="text-2xl font-black mt-1">Comments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{comments.length} total</p>
        </div>

        <input
          type="text"
          placeholder="Search by video title or username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-red-600"
        />

        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="flex gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-white">{c.display_name || "Unknown"}</span>
                  <span className="text-xs text-gray-600">on</span>
                  <Link to={`/watch/${c.video_id}`} className="text-xs font-semibold truncate max-w-[200px]" style={{ color: '#E8001D' }}>
                    {c.video_title}
                  </Link>
                  <span className="text-xs text-gray-600 ml-auto">{relativeTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{c.body}</p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="flex-shrink-0 p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors self-start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-12 text-gray-500">No comments found</p>
          )}
        </div>
      </div>
    </div>
  );
}
