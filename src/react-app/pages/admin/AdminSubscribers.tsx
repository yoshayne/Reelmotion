import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import { Search } from "lucide-react";

interface SubscriberRow {
  id: number;
  email: string;
  display_name: string | null;
  created_at: string;
  plan: string | null;
  status: string | null;
  period_end_date: string | null;
}

export default function AdminSubscribers() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/subscribers")
      .then((r) => r.json() as Promise<SubscriberRow[]>)
      .then(setSubscribers)
      .finally(() => setLoading(false));
  }, [isCreator]);

  const filtered = subscribers.filter(
    (s) => !search ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.display_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    active: "text-green-400",
    trialing: "text-blue-400",
    past_due: "text-yellow-400",
    canceled: "text-gray-400",
  };

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
          <h1 className="text-2xl font-black mt-1">Subscribers ({subscribers.length})</h1>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search by email or name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-red-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-500">
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Renewal</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-3 pr-4">{s.email}</td>
                  <td className="py-3 pr-4 text-gray-400">{s.display_name || "—"}</td>
                  <td className="py-3 pr-4 capitalize">{s.plan || "—"}</td>
                  <td className={`py-3 pr-4 capitalize ${statusColor[s.status ?? ""] ?? "text-gray-400"}`}>
                    {s.status || "—"}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {s.period_end_date ? new Date(s.period_end_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-12 text-gray-500">No subscribers found</p>
          )}
        </div>
      </div>
    </div>
  );
}
