import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import { apiFetch } from "@/react-app/utils/api";
import type { CarouselItem } from "@/shared/types";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

export default function AdminCarousel() {
  const { isCreator, isChecking } = useAdminRole();
  const navigate = useNavigate();
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking && !isCreator) navigate("/browse");
  }, [isCreator, isChecking, navigate]);

  useEffect(() => {
    if (!isCreator) return;
    apiFetch("/api/admin/carousel")
      .then((r) => r.json() as Promise<CarouselItem[]>)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isCreator]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this carousel item?")) return;
    await apiFetch(`/api/admin/carousel/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-4xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-400">← Admin</Link>
            <h1 className="text-2xl font-black mt-1">Carousel</h1>
          </div>
          <Link to="/admin/carousel/new" className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm">
            <Plus className="w-4 h-4" /> Add Item
          </Link>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="w-24 aspect-video rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">Order: {item.display_order}</span>
                  {item.is_active ? (
                    <span className="flex items-center gap-1 text-xs text-green-500"><Eye className="w-3 h-3" /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500"><EyeOff className="w-3 h-3" /> Hidden</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/carousel/${item.id}`} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                  <Edit className="w-4 h-4" />
                </Link>
                <button onClick={() => handleDelete(item.id)} className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-center py-12 text-gray-500">No carousel items</p>}
        </div>
      </div>
    </div>
  );
}
