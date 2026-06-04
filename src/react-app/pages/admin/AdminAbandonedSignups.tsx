import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import type { SubscriptionAttempt } from "@/shared/types";

export default function AdminAbandonedSignups() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<SubscriptionAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/abandoned-signups")
      .then((r) => r.json() as Promise<SubscriptionAttempt[]>)
      .then(setAttempts)
      .finally(() => setLoading(false));
  }, [isCreator]);

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
          <h1 className="text-2xl font-black mt-1">Abandoned Signups ({attempts.length})</h1>
          <p className="text-sm text-gray-500 mt-1">Users who started checkout but didn't complete</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-500">
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {attempts.map((a) => (
                <tr key={a.id} className="hover:bg-gray-900/50">
                  <td className="py-3 pr-4">{a.email}</td>
                  <td className="py-3 pr-4 capitalize text-gray-400">{a.billing_period || "—"}</td>
                  <td className="py-3 text-gray-500">
                    {a.checkout_started_at ? new Date(a.checkout_started_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && <p className="text-center py-12 text-gray-500">No abandoned signups</p>}
        </div>
      </div>
    </div>
  );
}
