import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import type { Series, Category } from "@/shared/types";
import { Upload } from "lucide-react";

type SeriesFormData = Partial<Omit<Series, "id" | "created_at" | "updated_at" | "episode_count">>;

export default function AdminSeriesForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCreator, isChecking } = useAdminRole();
  const isNew = !id || id === "new";
  const [form, setForm] = useState<SeriesFormData>({
    title: "", slug: "", description: "", cover_image_url: "", carousel_image_url: "",
    hero_image_url: "", director: "", cast: "", content_rating: "", release_date: undefined,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    fetch("/api/categories").then((r) => r.json() as Promise<Category[]>).then(setCategories);
    if (!isNew && id) {
      apiFetch("/api/admin/series")
        .then((r) => r.json() as Promise<Series[]>)
        .then((list) => { const s = list.find((x) => x.id === Number(id)); if (s) setForm(s); });
    }
  }, [isCreator, id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof SeriesFormData) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiFetchForm("/api/admin/upload-image", fd);
    const data = await res.json() as { url: string };
    setForm((prev) => ({ ...prev, [field]: data.url }));
  };

  const generateSlug = () => {
    setForm((prev) => ({
      ...prev,
      slug: (prev.title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/api/admin/series" : `/api/admin/series/${id}`;
    await apiFetch(url, { method, body: JSON.stringify(form) });
    setSaving(false);
    navigate("/admin/series");
  };

  if (isChecking) return null;

  const imageFields: Array<{ field: keyof SeriesFormData; label: string }> = [
    { field: "cover_image_url", label: "Cover Image" },
    { field: "carousel_image_url", label: "Carousel Image" },
    { field: "hero_image_url", label: "Hero Image" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-2xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <Link to="/admin/series" className="text-sm text-gray-500 hover:text-gray-400 mb-4 inline-block">← Series</Link>
        <h1 className="text-2xl font-black mb-6">{isNew ? "Add Series" : "Edit Series"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Title *</label>
            <input name="title" value={form.title ?? ""} onChange={handleChange} required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Slug *</label>
            <div className="flex gap-2">
              <input name="slug" value={form.slug ?? ""} onChange={handleChange} required
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
              <button type="button" onClick={generateSlug}
                className="px-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs transition-colors">Auto</button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea name="description" value={form.description ?? ""} onChange={handleChange} rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category</label>
              <select name="category_id" value={form.category_id ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600">
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Rating</label>
              <input name="content_rating" value={form.content_rating ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Release Date</label>
              <input name="release_date" type="date" value={form.release_date ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Director</label>
            <input name="director" value={form.director ?? ""} onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Cast</label>
            <input name="cast" value={form.cast ?? ""} onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {imageFields.map(({ field, label }) => (
              <div key={field}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                {form[field] && (
                  <img src={form[field] as string} alt={label} className="w-full aspect-video object-cover rounded-xl border border-gray-700 mb-2" />
                )}
                <label className="flex items-center justify-center gap-1 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs cursor-pointer">
                  <Upload className="w-3 h-3" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field)} />
                </label>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Link to="/admin/series" className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-center text-sm font-medium">Cancel</Link>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-xl text-sm font-bold">
              {saving ? "Saving..." : isNew ? "Create Series" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
