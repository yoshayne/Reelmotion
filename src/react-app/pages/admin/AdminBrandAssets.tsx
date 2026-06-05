import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch, apiFetchForm } from "@/react-app/utils/api";
import type { BrandAsset } from "@/shared/types";
import { Upload, Image } from "lucide-react";

export default function AdminBrandAssets() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [assetName, setAssetName] = useState("");

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/brand-assets")
      .then((r) => r.json() as Promise<BrandAsset[]>)
      .then(setAssets)
      .finally(() => setLoading(false));
  }, [isCreator]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "brand");
    fd.append("name", assetName || file.name);
    const res = await apiFetchForm("/api/admin/upload-image", fd);
    const data = await res.json() as { key: string; url: string };
    setAssets((prev) => [...prev, {
      id: Date.now(), name: assetName || file.name, description: null,
      file_key: data.key, content_type: file.type, file_size: file.size,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }]);
    setAssetName("");
    setUploading(false);
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
          <h1 className="text-2xl font-black mt-1">Brand Assets</h1>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-3">Upload New Asset</h2>
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="Asset name (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-red-600"
          />
          <label className={`flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium cursor-pointer transition-colors ${uploading ? "opacity-50" : ""}`}>
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Image"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                {asset.content_type?.startsWith("image/") ? (
                  <img
                    src={`/api/images/${encodeURIComponent(asset.file_key)}`}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{asset.file_key}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(`/api/images/${encodeURIComponent(asset.file_key)}`)}
                  className="mt-2 w-full py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors"
                >
                  Copy URL
                </button>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">No brand assets yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
