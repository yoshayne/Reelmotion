import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/react-app/components/Navbar";
import { apiFetch } from "@/react-app/utils/api";
import { AlertTriangle } from "lucide-react";

export default function DeleteAccountPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) return null;
  if (!user) {
    navigate("/");
    return null;
  }

  const handleDelete = async () => {
    if (confirmation !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/users/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div
        className="max-w-lg mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-900/40 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-red-500">Delete Account</h1>
        </div>

        <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-5 mb-6">
          <p className="font-semibold mb-2">This action is permanent and cannot be undone.</p>
          <ul className="space-y-1.5 text-sm text-gray-400 list-disc pl-4">
            <li>Your profile and all data will be permanently deleted</li>
            <li>Any active subscription will be cancelled immediately</li>
            <li>Your watch history and watchlist will be lost</li>
            <li>You cannot recover this account</li>
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            Type <span className="font-mono text-white">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors font-mono"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-600/40 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/account"
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium text-center transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleDelete}
            disabled={confirmation !== "DELETE" || deleting}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
          >
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
