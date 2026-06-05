import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import type { Video, Series, Category } from "@/shared/types";
import { Upload } from "lucide-react";

type VideoFormData = Partial<Omit<Video, "id" | "created_at" | "updated_at">>;

export default function AdminVideoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCreator, isChecking } = useAdminRole();
  const isNew = !id || id === "new";
  const [form, setForm] = useState<VideoFormData>({
    title: "", slug: "", description: "", content_type: "movie",
    mux_asset_id: "", mux_playback_id: "", thumbnail_url: "", hero_image_url: "",
    carousel_image_url: "", is_published: false, is_free: false,
    content_rating: "", genre: "", cast: "", director: "",
    episode_number: undefined, season_number: undefined,
    intro_start_seconds: undefined, intro_end_seconds: undefined,
  });
  const [series, setSeries] = useState<Series[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    Promise.all([
      apiFetch("/api/admin/series").then((r) => r.json() as Promise<Series[]>),
      fetch("/api/categories").then((r) => r.json() as Promise<Category[]>),
    ]).then(([s, c]) => { setSeries(s); setCategories(c); });

    if (!isNew && id) {
      apiFetch("/api/admin/videos")
        .then((r) => r.json() as Promise<Video[]>)
        .then((vids) => {
          const v = vids.find((x) => x.id === Number(id));
          if (v) setForm(v);
        });
    }
  }, [isCreator, id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked
        : value === "" ? undefined : isNaN(Number(value)) || type === "text" ? value : Number(value),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "thumbnail_url" | "hero_image_url" | "carousel_image_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setter = field === "thumbnail_url" ? setUploadingThumb : setUploadingHero;
    setter(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetchForm("/api/admin/upload-image", fd);
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json() as { url: string };
      setForm((prev) => ({ ...prev, [field]: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setter(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/videos" : `/api/admin/videos/${id}`;
      const res = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      navigate("/admin/videos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = (form.title ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setForm((prev) => ({ ...prev, slug }));
  };

  if (isChecking) return null;

  return (
    <div className="min-h-screen bg-black text-white">

      <div
        className="max-w-2xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <Link to="/admin/videos" className="text-sm text-gray-500 hover:text-gray-400 mb-4 inline-block">
          ← Videos
        </Link>
        <h1 className="text-2xl font-black mb-6">{isNew ? "Add Video" : "Edit Video"}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Title *</label>
              <input name="title" value={form.title ?? ""} onChange={handleChange} required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Slug *</label>
              <div className="flex gap-2">
                <input name="slug" value={form.slug ?? ""} onChange={handleChange} required
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-red-600" />
                <button type="button" onClick={generateSlug}
                  className="px-3 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs transition-colors">
                  Auto
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Content Type</label>
              <select name="content_type" value={form.content_type ?? "movie"} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600">
                <option value="movie">Movie</option>
                <option value="episode">Episode</option>
                <option value="clip">Clip</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea name="description" value={form.description ?? ""} onChange={handleChange} rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Mux Asset ID</label>
              <input name="mux_asset_id" value={form.mux_asset_id ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Mux Playback ID</label>
              <input name="mux_playback_id" value={form.mux_playback_id ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Series</label>
              <select name="series_id" value={form.series_id ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600">
                <option value="">None</option>
                {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category</label>
              <select name="category_id" value={form.category_id ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600">
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {form.content_type === "episode" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Season #</label>
                <input name="season_number" type="number" value={form.season_number ?? ""} onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Episode #</label>
                <input name="episode_number" type="number" value={form.episode_number ?? ""} onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Intro Start (sec)</label>
              <input name="intro_start_seconds" type="number" step="0.1" value={form.intro_start_seconds ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Intro End (sec)</label>
              <input name="intro_end_seconds" type="number" step="0.1" value={form.intro_end_seconds ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Genre</label>
              <input name="genre" value={form.genre ?? ""} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Rating</label>
              <input name="content_rating" value={form.content_rating ?? ""} onChange={handleChange}
                placeholder="PG, R, NR..."
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
            <label className="block text-sm text-gray-400 mb-1.5">Cast (comma separated)</label>
            <input name="cast" value={form.cast ?? ""} onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
          </div>

          {/* Image uploads */}
          <div className="grid grid-cols-3 gap-3">
            {(["thumbnail_url", "hero_image_url", "carousel_image_url"] as const).map((field) => {
              const labels: Record<string, string> = { thumbnail_url: "Thumbnail", hero_image_url: "Hero Image", carousel_image_url: "Carousel Image" };
              const uploading = field === "thumbnail_url" ? uploadingThumb : uploadingHero;
              return (
                <div key={field}>
                  <label className="block text-sm text-gray-400 mb-1.5">{labels[field]}</label>
                  <div className="relative">
                    {form[field as keyof VideoFormData] ? (
                      <img
                        src={form[field as keyof VideoFormData] as string}
                        alt={labels[field]}
                        className="w-full aspect-video object-cover rounded-xl border border-gray-700 mb-2"
                      />
                    ) : null}
                    <label className={`flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs cursor-pointer transition-colors ${uploading ? "opacity-50" : ""}`}>
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? "Uploading..." : "Upload"}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading}
                        onChange={(e) => handleImageUpload(e, field)} />
                    </label>
                    <div className="mt-1">
                      <input name={field} value={form[field as keyof VideoFormData] as string ?? ""} onChange={handleChange}
                        placeholder="or paste URL"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published ?? false}
                onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm">Published</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="is_free"
                checked={form.is_free ?? false}
                onChange={(e) => setForm((p) => ({ ...p, is_free: e.target.checked }))}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm">Free to watch</span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm text-red-400 border border-red-900 bg-red-950/40">{error}</div>
          )}
          <div className="flex gap-3 pt-4">
            <Link
              to="/admin/videos"
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-center text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-xl text-sm font-bold transition-colors"
            >
              {saving ? "Saving..." : isNew ? "Create Video" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
