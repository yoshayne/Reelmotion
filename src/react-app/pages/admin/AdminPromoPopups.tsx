import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import type { PromoPopup } from "@/shared/types";
import { Plus, Trash2, Eye, EyeOff, ImageIcon, Pencil, X, Check } from "lucide-react";

interface VideoOption { id: number; title: string; }
interface SeriesOption { id: number; title: string; }

type LinkType = "none" | "video" | "series" | "custom";

interface PopupForm {
  title: string;
  image_key: string;
  link_type: LinkType;
  link_video_id: number | null;
  link_series_id: number | null;
  link_custom_url: string;
  is_active: boolean;
  frequency: string;
}

const BLANK_FORM: PopupForm = {
  title: "",
  image_key: "",
  link_type: "none",
  link_video_id: null,
  link_series_id: null,
  link_custom_url: "",
  is_active: false,
  frequency: "once_per_day",
};

function popupToForm(p: PromoPopup): PopupForm {
  return {
    title: p.title ?? "",
    image_key: p.image_key ?? "",
    link_type: (p.link_type as LinkType) ?? "none",
    link_video_id: p.link_video_id ?? null,
    link_series_id: p.link_series_id ?? null,
    link_custom_url: p.link_custom_url ?? "",
    is_active: p.is_active,
    frequency: p.frequency ?? "once_per_day",
  };
}

function buildPayload(form: PopupForm) {
  return {
    title: form.title,
    image_key: form.image_key,
    link_type: form.link_type === "none" ? null : form.link_type,
    link_video_id: form.link_type === "video" ? form.link_video_id : null,
    link_series_id: form.link_type === "series" ? form.link_series_id : null,
    link_custom_url: form.link_type === "custom" ? form.link_custom_url : null,
    frequency: form.frequency,
    is_active: form.is_active,
  };
}

// ─── Shared form fields ──────────────────────────────────────────────────────
function PopupFormFields({
  form, setForm, videos, series,
  imagePreview, setImagePreview,
  uploadingImg, setUploadingImg,
  error, setError,
  fileInputRef,
}: {
  form: PopupForm;
  setForm: React.Dispatch<React.SetStateAction<PopupForm>>;
  videos: VideoOption[];
  series: SeriesOption[];
  imagePreview: string;
  setImagePreview: (v: string) => void;
  uploadingImg: boolean;
  setUploadingImg: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const set = (field: keyof PopupForm, value: unknown) =>
    setForm(p => ({ ...p, [field]: value }));

  const changeLinkType = (type: LinkType) =>
    setForm(p => ({ ...p, link_type: type, link_video_id: null, link_series_id: null, link_custom_url: "" }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "promo");
      const res = await apiFetchForm("/api/admin/upload-image", fd);
      const data = await res.json() as { key: string; url: string };
      setForm(p => ({ ...p, image_key: data.key }));
      setImagePreview(data.url);
    } catch {
      setError("Image upload failed. Please try again.");
      setImagePreview("");
    } finally {
      setUploadingImg(false);
    }
  };

  const clearImage = () => {
    setImagePreview("");
    setForm(p => ({ ...p, image_key: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <input
        placeholder="Popup title"
        value={form.title}
        onChange={e => set("title", e.target.value)}
        required
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600"
      />

      {/* Image */}
      <div>
        {imagePreview ? (
          <div className="relative mb-2 rounded-xl overflow-hidden border border-gray-700" style={{ aspectRatio: "16/9" }}>
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            {uploadingImg && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <button type="button" onClick={clearImage}
              className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-gray-300 hover:text-white">
              Remove
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 px-4 py-8 bg-gray-800 border border-dashed border-gray-600 rounded-xl text-sm cursor-pointer transition-colors ${uploadingImg ? "opacity-50 pointer-events-none" : "hover:border-gray-500"}`}>
            <ImageIcon className="w-8 h-8 text-gray-600" />
            <span className="text-gray-400">{uploadingImg ? "Uploading…" : "Click to upload popup image"}</span>
            <span className="text-xs text-gray-600">Recommended: 16:9 ratio</span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={handleImageUpload} />
          </label>
        )}
      </div>

      {/* Link type */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Link to</p>
        <div className="grid grid-cols-4 gap-2">
          {(["none", "video", "series", "custom"] as const).map(type => (
            <button key={type} type="button" onClick={() => changeLinkType(type)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors capitalize ${form.link_type === type ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {type === "none" ? "No Link" : type}
            </button>
          ))}
        </div>
      </div>

      {form.link_type === "video" && (
        <select value={form.link_video_id ?? ""} onChange={e => set("link_video_id", e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" required>
          <option value="">— Select a film —</option>
          {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
        </select>
      )}

      {form.link_type === "series" && (
        <select value={form.link_series_id ?? ""} onChange={e => set("link_series_id", e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" required>
          <option value="">— Select a series —</option>
          {series.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      )}

      {form.link_type === "custom" && (
        <input placeholder="https://…" value={form.link_custom_url} onChange={e => set("link_custom_url", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" required />
      )}

      <div className="flex gap-3 items-center">
        <select value={form.frequency} onChange={e => set("frequency", e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600">
          <option value="once_per_day">Show once per day</option>
          <option value="always">Show every visit</option>
          <option value="once_ever">Show once ever</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer flex-shrink-0">
          <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="w-4 h-4 accent-red-600" />
          Active
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminPromoPopups() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [popups, setPopups] = useState<PromoPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [series, setSeries] = useState<SeriesOption[]>([]);

  // Create state
  const [createForm, setCreateForm] = useState<PopupForm>({ ...BLANK_FORM });
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [createUploadingImg, setCreateUploadingImg] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PopupForm>({ ...BLANK_FORM });
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editUploadingImg, setEditUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    Promise.all([
      apiFetch("/api/admin/promo-popups").then(r => r.json()),
      apiFetch("/api/admin/videos").then(r => r.json()),
      apiFetch("/api/admin/series").then(r => r.json()),
    ]).then(([popupData, videoData, seriesData]) => {
      setPopups(Array.isArray(popupData) ? popupData : []);
      setVideos((Array.isArray(videoData) ? videoData : []).map((v: any) => ({ id: v.id, title: v.title })));
      setSeries((Array.isArray(seriesData) ? seriesData : []).map((s: any) => ({ id: s.id, title: s.title })));
    }).finally(() => setLoading(false));
  }, [isCreator]);

  const openEdit = (popup: PromoPopup) => {
    setEditingId(popup.id);
    setEditForm(popupToForm(popup));
    setEditImagePreview(popup.image_key ? `/api/images/${encodeURIComponent(popup.image_key)}` : "");
    setEditError("");
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditImagePreview("");
    setEditError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.image_key) { setCreateError("Please upload an image first."); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await apiFetch("/api/admin/promo-popups", {
        method: "POST",
        body: JSON.stringify(buildPayload(createForm)),
      });
      if (!res.ok) { setCreateError("Failed to create popup."); return; }
      const newPopup = await res.json() as PromoPopup;
      setPopups(prev => [newPopup, ...prev]);
      setCreateForm({ ...BLANK_FORM });
      setCreateImagePreview("");
      if (createFileInputRef.current) createFileInputRef.current.value = "";
    } catch {
      setCreateError("Failed to create popup.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.image_key) { setEditError("Please upload an image first."); return; }
    setSaving(true);
    setEditError("");
    try {
      const res = await apiFetch(`/api/admin/promo-popups/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(buildPayload(editForm)),
      });
      if (!res.ok) { setEditError("Failed to save changes."); return; }
      const updated = await res.json() as PromoPopup;
      setPopups(prev => prev.map(p => p.id === editingId ? updated : p));
      closeEdit();
    } catch {
      setEditError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (popup: PromoPopup) => {
    const res = await apiFetch(`/api/admin/promo-popups/${popup.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !popup.is_active }),
    });
    const updated = await res.json() as PromoPopup;
    setPopups(prev => prev.map(p => p.id === popup.id ? updated : p));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this promo popup?")) return;
    await apiFetch(`/api/admin/promo-popups/${id}`, { method: "DELETE" });
    setPopups(prev => prev.filter(p => p.id !== id));
    if (editingId === id) closeEdit();
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <div className="mb-6">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-400">← Admin</Link>
          <h1 className="text-2xl font-black mt-1">Promo Popups</h1>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-8">
          <h2 className="font-bold text-sm tracking-wide uppercase text-gray-400 mb-4">New Popup</h2>
          <PopupFormFields
            form={createForm} setForm={setCreateForm}
            videos={videos} series={series}
            imagePreview={createImagePreview} setImagePreview={setCreateImagePreview}
            uploadingImg={createUploadingImg} setUploadingImg={setCreateUploadingImg}
            error={createError} setError={setCreateError}
            fileInputRef={createFileInputRef}
          />
          <button type="submit" disabled={creating || !createForm.title || !createForm.image_key || createUploadingImg}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-colors">
            <Plus className="w-4 h-4" />
            {creating ? "Creating…" : "Create Popup"}
          </button>
        </form>

        {/* List */}
        <div className="space-y-3">
          {popups.map(popup => {
            const linkLabel = popup.link_type === "video"
              ? `Film · ${videos.find(v => v.id === popup.link_video_id)?.title ?? popup.link_video_id}`
              : popup.link_type === "series"
              ? `Series · ${series.find(s => s.id === popup.link_series_id)?.title ?? popup.link_series_id}`
              : popup.link_type === "custom"
              ? popup.link_custom_url ?? "Custom URL"
              : "No link";

            const isEditing = editingId === popup.id;

            return (
              <div key={popup.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                {/* Row */}
                <div className="flex gap-3 p-3 items-center">
                  <div className="w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800" style={{ aspectRatio: "16/9" }}>
                    {popup.image_key ? (
                      <img src={`/api/images/${encodeURIComponent(popup.image_key)}`} alt={popup.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{popup.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{linkLabel}</p>
                    <p className="text-xs text-gray-600 mt-0.5 capitalize">{popup.frequency.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => isEditing ? closeEdit() : openEdit(popup)}
                      className={`p-2 rounded-lg transition-colors ${isEditing ? "bg-red-600/20 text-red-400" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                      title={isEditing ? "Cancel edit" : "Edit popup"}>
                      {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toggleActive(popup)}
                      className={`p-2 rounded-lg transition-colors ${popup.is_active ? "bg-green-600/20 text-green-400" : "bg-gray-800 text-gray-500"}`}
                      title={popup.is_active ? "Active — click to deactivate" : "Inactive — click to activate"}>
                      {popup.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(popup.id)}
                      className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <form onSubmit={handleSaveEdit} className="border-t border-gray-800 p-4 bg-gray-900/80 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Editing popup</p>
                    <PopupFormFields
                      form={editForm} setForm={setEditForm}
                      videos={videos} series={series}
                      imagePreview={editImagePreview} setImagePreview={setEditImagePreview}
                      uploadingImg={editUploadingImg} setUploadingImg={setEditUploadingImg}
                      error={editError} setError={setEditError}
                      fileInputRef={editFileInputRef}
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving || !editForm.title || !editForm.image_key || editUploadingImg}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-colors">
                        <Check className="w-4 h-4" />
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                      <button type="button" onClick={closeEdit}
                        className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
          {popups.length === 0 && (
            <p className="text-center py-12 text-gray-500">No promo popups yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
