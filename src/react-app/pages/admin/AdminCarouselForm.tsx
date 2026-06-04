import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import type { CarouselItem } from "@/shared/types";
import { Upload } from "lucide-react";

type CarouselFormData = Partial<Omit<CarouselItem, "id" | "created_at" | "updated_at">>;

export default function AdminCarouselForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCreator, isChecking } = useAdminRole();
  const isNew = !id || id === "new";
  const [form, setForm] = useState<CarouselFormData>({
    title: "", description: "", image_url: "", display_order: 0, is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator || isNew) return;
    apiFetch("/api/admin/carousel")
      .then((r) => r.json() as Promise<CarouselItem[]>)
      .then((list) => { const item = list.find((x) => x.id === Number(id)); if (item) setForm(item); });
  }, [isCreator, id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked
        : name === "display_order" ? Number(value) : value || undefined,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiFetchForm("/api/admin/upload-image", fd);
    const data = await res.json() as { url: string };
    setForm((prev) => ({ ...prev, image_url: data.url }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/api/admin/carousel" : `/api/admin/carousel/${id}`;
    await apiFetch(url, { method, body: JSON.stringify(form) });
    setSaving(false);
    navigate("/admin/carousel");
  };

  if (isChecking) return null;

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-lg mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <Link to="/admin/carousel" className="text-sm text-gray-500 hover:text-gray-400 mb-4 inline-block">← Carousel</Link>
        <h1 className="text-2xl font-black mb-6">{isNew ? "Add Carousel Item" : "Edit Carousel Item"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Title *</label>
            <input name="title" value={form.title ?? ""} onChange={handleChange} required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea name="description" value={form.description ?? ""} onChange={handleChange} rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Image *</label>
            {form.image_url && (
              <img src={form.image_url} alt="Preview" className="w-full aspect-video object-cover rounded-xl border border-gray-700 mb-2" />
            )}
            <label className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm cursor-pointer mb-2 ${uploading ? "opacity-50" : ""}`}>
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleImageUpload} />
            </label>
            <input name="image_url" value={form.image_url ?? ""} onChange={handleChange} placeholder="or paste URL"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Display Order</label>
              <input name="display_order" type="number" value={form.display_order ?? 0} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Release Date</label>
              <input name="release_date" type="date" value={form.release_date ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" name="is_active" checked={form.is_active ?? true}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 accent-red-600" />
            <span className="text-sm">Active (visible on homepage)</span>
          </label>
          <div className="flex gap-3 pt-4">
            <Link to="/admin/carousel" className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-center text-sm font-medium">Cancel</Link>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-xl text-sm font-bold">
              {saving ? "Saving..." : isNew ? "Create Item" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
