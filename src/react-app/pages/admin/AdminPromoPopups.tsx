import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import type { PromoPopup } from "@/shared/types";
import { Plus, Trash2, Eye, EyeOff, Upload } from "lucide-react";

export default function AdminPromoPopups() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [popups, setPopups] = useState<PromoPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", image_key: "", link_type: "custom", link_custom_url: "",
    is_active: false, frequency: "once_per_day",
  });
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/promo-popups")
      .then((r) => r.json() as Promise<PromoPopup[]>)
      .then(setPopups)
      .finally(() => setLoading(false));
  }, [isCreator]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "promo");
    const res = await apiFetchForm("/api/admin/upload-image", fd);
    const data = await res.json() as { key: string; url: string };
    setForm((p) => ({ ...p, image_key: data.key }));
    setImageUrl(data.url);
    setUploadingImg(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await apiFetch("/api/admin/promo-popups", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const newPopup = await res.json() as PromoPopup;
    setPopups((prev) => [newPopup, ...prev]);
    setForm({ title: "", image_key: "", link_type: "custom", link_custom_url: "", is_active: false, frequency: "once_per_day" });
    setImageUrl("");
    setCreating(false);
  };

  const toggleActive = async (popup: PromoPopup) => {
    const res = await apiFetch(`/api/admin/promo-popups/${popup.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !popup.is_active }),
    });
    const updated = await res.json() as PromoPopup;
    setPopups((prev) => prev.map((p) => p.id === popup.id ? updated : p));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this promo popup?")) return;
    await apiFetch(`/api/admin/promo-popups/${id}`, { method: "DELETE" });
    setPopups((prev) => prev.filter((p) => p.id !== id));
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
        <div className="mb-6">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-400">← Admin</Link>
          <h1 className="text-2xl font-black mt-1">Promo Popups</h1>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="font-semibold">New Promo Popup</h2>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          <div>
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="w-full aspect-video object-cover rounded-xl border border-gray-700 mb-2" />
            )}
            <label className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm cursor-pointer ${uploadingImg ? "opacity-50" : ""}`}>
              <Upload className="w-4 h-4" />
              {uploadingImg ? "Uploading..." : "Upload Popup Image"}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={handleImageUpload} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.link_type} onChange={(e) => setForm((p) => ({ ...p, link_type: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600">
              <option value="custom">Custom URL</option>
              <option value="video">Video</option>
              <option value="series">Series</option>
            </select>
            <select value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600">
              <option value="once_per_day">Once per day</option>
              <option value="always">Always</option>
              <option value="once_ever">Once ever</option>
            </select>
          </div>
          {form.link_type === "custom" && (
            <input placeholder="Custom URL" value={form.link_custom_url}
              onChange={(e) => setForm((p) => ({ ...p, link_custom_url: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          )}
          <label className="flex items-center gap-2.5 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 accent-red-600" />
            Active
          </label>
          <button type="submit" disabled={creating || !form.title || !form.image_key}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            {creating ? "Creating..." : "Create Popup"}
          </button>
        </form>

        {/* List */}
        <div className="space-y-3">
          {popups.map((popup) => (
            <div key={popup.id} className="flex gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="w-20 aspect-square rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                <img
                  src={`/api/images/${encodeURIComponent(popup.image_key)}`}
                  alt={popup.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{popup.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{popup.link_type} · {popup.frequency.replace(/_/g, " ")}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(popup)}
                  className={`p-2 rounded-lg transition-colors ${popup.is_active ? "bg-green-600/20 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                  {popup.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(popup.id)}
                  className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {popups.length === 0 && <p className="text-center py-12 text-gray-500">No promo popups</p>}
        </div>
      </div>
    </div>
  );
}
