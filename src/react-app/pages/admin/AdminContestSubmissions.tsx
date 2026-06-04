import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import type { ContestSubmission } from "@/shared/types";
import { ExternalLink } from "lucide-react";

export default function AdminContestSubmissions() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/contest-submissions")
      .then((r) => r.json() as Promise<ContestSubmission[]>)
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, [isCreator]);

  const updateStatus = async (id: number, status: string) => {
    await apiFetch(`/api/admin/contest-submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: status as ContestSubmission["status"] } : s));
  };

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
    accepted: "bg-green-600/20 text-green-400 border-green-600/30",
    rejected: "bg-red-900/20 text-red-400 border-red-600/30",
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <div className="mb-6">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-400">← Admin</Link>
          <h1 className="text-2xl font-black mt-1">Contest Submissions ({submissions.length})</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors capitalize ${filter === f ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold">{s.film_title}</h3>
                  <p className="text-sm text-gray-400">{s.director_name} · {s.email}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{s.genre} · {s.runtime}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs border capitalize flex-shrink-0 ${statusColor[s.status] ?? ""}`}>
                  {s.status}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a href={s.viewing_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                  <ExternalLink className="w-3 h-3" /> View Film
                </a>
                {s.trailer_link && (
                  <a href={s.trailer_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                    <ExternalLink className="w-3 h-3" /> Trailer
                  </a>
                )}
                {s.password && <span className="text-xs text-gray-500">Password: {s.password}</span>}
                <div className="ml-auto flex gap-2">
                  {s.status !== "accepted" && (
                    <button onClick={() => updateStatus(s.id, "accepted")}
                      className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 border border-green-600/30 text-green-400 rounded-lg text-xs transition-colors">
                      Accept
                    </button>
                  )}
                  {s.status !== "rejected" && (
                    <button onClick={() => updateStatus(s.id, "rejected")}
                      className="px-3 py-1 bg-red-900/20 hover:bg-red-900/40 border border-red-600/30 text-red-400 rounded-lg text-xs transition-colors">
                      Reject
                    </button>
                  )}
                  {s.status !== "pending" && (
                    <button onClick={() => updateStatus(s.id, "pending")}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors">
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">{new Date(s.created_at).toLocaleString()}</p>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12 text-gray-500">No submissions</p>}
        </div>
      </div>
    </div>
  );
}
