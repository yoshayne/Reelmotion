import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "@/react-app/utils/api";
import { useAdminRole } from "@/react-app/hooks/useAdminRole";
import type { ActingClassPackage, ActingClassDate, ActingClassRegistration, ActingClassWaitlistEntry } from "@/shared/types";
import { Plus, Trash2, Check, X, ExternalLink, Users } from "lucide-react";

type Tab = "packages" | "dates" | "registrations" | "waitlist";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Packages Tab ─────────────────────────────────────────────────────────────

function PackagesTab() {
  const [packages, setPackages] = useState<ActingClassPackage[]>([]);
  const [editing, setEditing] = useState<Record<number, Partial<ActingClassPackage>>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/classes/packages").then(r => r.json()).then(setPackages);
  }, []);

  const setField = (id: number, field: keyof ActingClassPackage, val: unknown) => {
    setEditing(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const save = async (pkg: ActingClassPackage) => {
    const edits = editing[pkg.id];
    if (!edits) return;
    setSaving(pkg.id);
    try {
      const res = await apiFetch(`/api/admin/classes/packages/${pkg.id}`, {
        method: "PATCH",
        body: JSON.stringify(edits),
      });
      const updated = await res.json() as ActingClassPackage;
      setPackages(prev => prev.map(p => p.id === pkg.id ? updated : p));
      setEditing(prev => { const n = { ...prev }; delete n[pkg.id]; return n; });
    } finally {
      setSaving(null);
    }
  };

  const cancel = (id: number) => setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        Set the Stripe Price ID for each package to enable registration. Create the price in your{" "}
        <a href="https://dashboard.stripe.com/products" target="_blank" rel="noreferrer" className="text-[#E8001D] hover:underline inline-flex items-center gap-0.5">
          Stripe Dashboard <ExternalLink className="w-3 h-3" />
        </a>
        {" "}(one-time payment, not recurring), then paste the Price ID (starts with <code className="bg-zinc-900 px-1 rounded text-xs">price_</code>) here.
      </p>

      {packages.map(pkg => {
        const edits = editing[pkg.id] ?? {};
        const isDirty = Object.keys(edits).length > 0;

        return (
          <div key={pkg.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="font-bold text-sm">{pkg.name}</div>
                <div className="text-zinc-400 text-xs mt-0.5">Default price: {formatPrice(pkg.price_cents)}</div>
              </div>
              <div className="flex items-center gap-1">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={edits.is_active !== undefined ? !!edits.is_active : pkg.is_active}
                    onChange={e => setField(pkg.id, "is_active", e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#E8001D]"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Stripe Price ID</label>
                <input
                  type="text"
                  value={edits.stripe_price_id !== undefined ? (edits.stripe_price_id ?? "") : (pkg.stripe_price_id ?? "")}
                  onChange={e => setField(pkg.id, "stripe_price_id", e.target.value || null)}
                  placeholder="price_..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8001D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Price (cents)</label>
                  <input
                    type="number"
                    value={edits.price_cents !== undefined ? edits.price_cents : pkg.price_cents}
                    onChange={e => setField(pkg.id, "price_cents", Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8001D]"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Sort order</label>
                  <input
                    type="number"
                    value={edits.sort_order !== undefined ? edits.sort_order : pkg.sort_order}
                    onChange={e => setField(pkg.id, "sort_order", Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8001D]"
                  />
                </div>
              </div>
            </div>

            {isDirty && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => save(pkg)}
                  disabled={saving === pkg.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#E8001D] hover:bg-red-700 rounded-lg text-xs font-bold transition-colors"
                >
                  <Check className="w-3 h-3" />
                  {saving === pkg.id ? "Saving…" : "Save"}
                </button>
                <button onClick={() => cancel(pkg.id)} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Dates Tab ────────────────────────────────────────────────────────────────

function DatesTab() {
  const [dates, setDates] = useState<ActingClassDate[]>([]);
  const [packages, setPackages] = useState<ActingClassPackage[]>([]);
  const [form, setForm] = useState({ package_id: 0, date: "", time: "2:00 PM", capacity: 12 });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/classes/dates").then(r => r.json()),
      apiFetch("/api/admin/classes/packages").then(r => r.json()),
    ]).then(([d, p]) => {
      setDates(d as ActingClassDate[]);
      const pkgs = p as ActingClassPackage[];
      setPackages(pkgs);
      if (pkgs.length) setForm(f => ({ ...f, package_id: pkgs[0].id }));
    });
  }, []);

  const addDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await apiFetch("/api/admin/classes/dates", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const created = await res.json() as ActingClassDate;
      const pkg = packages.find(p => p.id === created.package_id);
      setDates(prev => [{ ...created, package_name: pkg?.name, price_cents: pkg?.price_cents }, ...prev]);
      setForm(f => ({ ...f, date: "" }));
    } finally {
      setAdding(false);
    }
  };

  const deleteDate = async (id: number) => {
    if (!confirm("Delete this date?")) return;
    await apiFetch(`/api/admin/classes/dates/${id}`, { method: "DELETE" });
    setDates(prev => prev.filter(d => d.id !== id));
  };

  const toggleActive = async (d: ActingClassDate) => {
    const res = await apiFetch(`/api/admin/classes/dates/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !d.is_active }),
    });
    const updated = await res.json() as ActingClassDate;
    setDates(prev => prev.map(x => x.id === d.id ? { ...x, ...updated } : x));
  };

  const upcoming = dates.filter(d => new Date(d.date + "T23:59:00") >= new Date()).sort((a, b) => a.date.localeCompare(b.date));
  const past = dates.filter(d => new Date(d.date + "T23:59:00") < new Date()).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Add date form */}
      <form onSubmit={addDate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="text-sm font-bold mb-1">Add a Date</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1 block">Package</label>
            <select
              value={form.package_id}
              onChange={e => setForm(f => ({ ...f, package_id: Number(e.target.value) }))}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8001D]"
            >
              {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8001D]"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Time</label>
            <input
              type="text"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8001D]"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Capacity</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8001D]"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8001D] hover:bg-red-700 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          {adding ? "Adding…" : "Add Date"}
        </button>
      </form>

      {/* Upcoming dates */}
      {upcoming.length > 0 && (
        <div>
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Upcoming</div>
          <div className="space-y-2">
            {upcoming.map(d => (
              <div key={d.id} className={`flex items-center justify-between gap-3 bg-zinc-900 border rounded-xl px-4 py-3 ${d.is_active ? "border-zinc-800" : "border-zinc-900 opacity-50"}`}>
                <div>
                  <div className="text-sm font-semibold">{d.package_name}</div>
                  <div className="text-xs text-zinc-400">{formatDate(d.date)} · {d.time}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{d.spots_remaining}/{d.capacity} spots remaining</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(d)} className={`text-xs px-2 py-1 rounded-lg font-medium ${d.is_active ? "bg-green-900/40 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                    {d.is_active ? "Active" : "Hidden"}
                  </button>
                  <button onClick={() => deleteDate(d.id)} className="p-1.5 bg-zinc-800 hover:bg-red-900/40 hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past dates */}
      {past.length > 0 && (
        <div>
          <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Past</div>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 10).map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3">
                <div>
                  <div className="text-sm">{d.package_name}</div>
                  <div className="text-xs text-zinc-500">{formatDate(d.date)} · {d.time}</div>
                </div>
                <div className="text-xs text-zinc-600">{d.capacity - d.spots_remaining} registered</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Registrations Tab ────────────────────────────────────────────────────────

function RegistrationsTab() {
  const [regs, setRegs] = useState<ActingClassRegistration[]>([]);

  useEffect(() => {
    apiFetch("/api/admin/classes/registrations").then(r => r.json()).then(setRegs);
  }, []);

  const confirmed = regs.filter(r => r.status === "confirmed");
  const pending = regs.filter(r => r.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <div className="text-2xl font-black text-green-400">{confirmed.length}</div>
          <div className="text-zinc-500 text-xs mt-0.5">Confirmed</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <div className="text-2xl font-black text-amber-400">{pending.length}</div>
          <div className="text-zinc-500 text-xs mt-0.5">Pending</div>
        </div>
      </div>

      {regs.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm">No registrations yet.</div>
      ) : (
        <div className="space-y-2">
          {regs.map(r => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{r.customer_name || r.customer_email}</div>
                  {r.customer_name && <div className="text-xs text-zinc-400">{r.customer_email}</div>}
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {r.package_name} · {r.class_date ? formatDate(r.class_date) : "—"}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${r.status === "confirmed" ? "bg-green-900/40 text-green-400" : "bg-amber-900/40 text-amber-400"}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Waitlist Tab ─────────────────────────────────────────────────────────────

function WaitlistTab() {
  const [list, setList] = useState<ActingClassWaitlistEntry[]>([]);

  useEffect(() => {
    apiFetch("/api/admin/classes/waitlist").then(r => r.json()).then(setList);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-zinc-400" />
        <span className="text-sm text-zinc-400">{list.length} on the 4-Week Program waitlist</span>
      </div>
      {list.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm">No waitlist entries yet.</div>
      ) : (
        <div className="space-y-2">
          {list.map(e => (
            <div key={e.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <div>
                <div className="text-sm font-medium">{e.name || e.email}</div>
                {e.name && <div className="text-xs text-zinc-400">{e.email}</div>}
              </div>
              <div className="text-xs text-zinc-600">{new Date(e.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminActingClasses() {
  useAdminRole();
  const [tab, setTab] = useState<Tab>("packages");

  const tabs: { id: Tab; label: string }[] = [
    { id: "packages", label: "Packages" },
    { id: "dates", label: "Dates" },
    { id: "registrations", label: "Registrations" },
    { id: "waitlist", label: "Waitlist" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Acting Classes</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Manage packages, dates, and registrations</p>
          </div>
          <Link
            to="/classes"
            target="_blank"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            View page <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors
                ${tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "packages" && <PackagesTab />}
        {tab === "dates" && <DatesTab />}
        {tab === "registrations" && <RegistrationsTab />}
        {tab === "waitlist" && <WaitlistTab />}
      </div>
    </div>
  );
}
