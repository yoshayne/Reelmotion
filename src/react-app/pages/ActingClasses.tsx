import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { ActingClassPackage, ActingClassDate } from "@/shared/types";

type PackageWithDates = ActingClassPackage & { dates: ActingClassDate[] };

const PACKAGE_DETAILS: Record<string, {
  tagline: string;
  bullets: string[];
  extra?: string;
}> = {
  "Self-Tape Audition Workshop": {
    tagline: "Learn. Record. Improve. Repeat.",
    bullets: [
      "Acting technique & character choices",
      "Audition preparation",
      "Camera & lighting basics",
      "On-camera performance",
      "Slate technique & common mistakes",
      "Live exercises + expert feedback",
    ],
  },
  "Workshop + Professional Self-Tape": {
    tagline: "Take what you learned and put it on camera.",
    extra: "Everything in the Workshop, PLUS a professionally recorded audition scene.",
    bullets: [
      "Full self-tape audition workshop",
      "Scene preparation & performance coaching",
      "Professional camera, lighting & audio",
      "Multiple takes",
      "Final self-tape recording delivered",
    ],
  },
  "Actor Starter Package": {
    tagline: "Train. Record. Get camera-ready.",
    extra: "Your complete starter kit for building audition materials.",
    bullets: [
      "Self-tape audition workshop",
      "Professional self-tape recording",
      "3 professionally captured & edited headshots",
    ],
  },
  "1-on-1 Premium Self-Tape Session": {
    tagline: "Don't just record your audition — get coached through it.",
    extra: "A private session built entirely around your specific audition.",
    bullets: [
      "Script & side breakdown",
      "Character development coaching",
      "Camera positioning & lighting",
      "Professional recording",
      "Multiple takes + performance feedback",
      "Final polished self-tape",
    ],
  },
  "The Casting Room": {
    tagline: "Step into the room. Monthly mock casting calls.",
    bullets: [
      "Audition sides provided in advance",
      "Prepare, perform & get recorded",
      "Realistic casting-room experience",
      "Instructor feedback after each take",
    ],
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr.slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatPrice(cents: number) {
  return `$${Math.floor(cents / 100)}`;
}

function DateRow({ slot, pkg }: { slot: ActingClassDate; pkg: PackageWithDates }) {
  const [loading, setLoading] = useState(false);
  const sharedRemaining = slot.session_spots_remaining ?? slot.spots_remaining;
  const full = sharedRemaining <= 0;
  const low = sharedRemaining > 0 && sharedRemaining <= 3;
  const canRegister = !full && !!pkg.stripe_price_id;

  const handleClick = async () => {
    if (!canRegister) return;
    setLoading(true);
    try {
      const res = await fetch("/api/classes/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_id: slot.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Unable to start checkout. Please try again.");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-t border-white/10">
      <div>
        <div className="text-sm font-semibold text-white">{formatDate(slot.date)}</div>
        <div className="text-xs text-white/50 mt-0.5">{slot.time}</div>
        {full ? (
          <div className="text-xs text-red-400 mt-0.5 font-medium">Sold out</div>
        ) : low ? (
          <div className="text-xs text-amber-400 mt-0.5 font-medium">{sharedRemaining} spot{sharedRemaining !== 1 ? "s" : ""} left</div>
        ) : (
          <div className="text-xs text-white/30 mt-0.5">{sharedRemaining} spots available</div>
        )}
      </div>
      <button
        onClick={handleClick}
        disabled={!canRegister || loading}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
          ${full ? "bg-white/10 text-white/30 cursor-not-allowed" :
            !pkg.stripe_price_id ? "bg-white/10 text-white/40 cursor-not-allowed" :
            "bg-[#E8001D] hover:bg-red-700 text-white"}`}
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {full ? "Full" : !pkg.stripe_price_id ? "Soon" : "Register"}
      </button>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackageWithDates }) {
  const [open, setOpen] = useState(false);
  const detail = PACKAGE_DETAILS[pkg.name] ?? { tagline: "", bullets: [] };
  const upcomingDates = pkg.dates.filter(d => d.is_active);
  const isPrivate = pkg.name === "1-on-1 Premium Self-Tape Session";

  return (
    <div className="flex flex-col bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/40 transition-colors group">
      {/* Top accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 to-cyan-400/0" />

      <div className="flex flex-col flex-1 p-5">
        {/* Price */}
        <div className="text-4xl font-black text-cyan-400 mb-1">{formatPrice(pkg.price_cents)}</div>

        {/* Name */}
        <h2 className="text-base font-black leading-tight text-white mb-2">{pkg.name}</h2>

        {/* Tagline */}
        <p className="text-xs text-white/50 leading-relaxed mb-4">{detail.tagline}</p>

        {/* What's included toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 text-xs text-cyan-500/70 hover:text-cyan-400 transition-colors mb-3 self-start"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {open ? "Hide details" : "What's included"}
        </button>

        {open && (
          <div className="mb-4 space-y-1.5">
            {detail.extra && (
              <p className="text-xs text-white/60 italic mb-2">{detail.extra}</p>
            )}
            {detail.bullets.map(b => (
              <div key={b} className="flex items-start gap-2 text-xs text-white/70">
                <span className="text-cyan-400 mt-0.5 flex-shrink-0">—</span>
                {b}
              </div>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Dates or book CTA */}
        {isPrivate ? (
          <a
            href="mailto:romediastudios@gmail.com?subject=1-on-1 Private Session Request"
            className="w-full flex items-center justify-center py-2.5 bg-[#E8001D] hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm mt-2"
          >
            Book Private Session
          </a>
        ) : upcomingDates.length > 0 ? (
          <div className="mt-2 space-y-0">
            {upcomingDates.map(slot => (
              <DateRow key={slot.id} slot={slot} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="mt-2 py-2 text-xs text-white/30 border-t border-white/10">
            No upcoming dates — check back soon.
          </div>
        )}
      </div>
    </div>
  );
}

function CastingRoomBanner({ pkg }: { pkg: PackageWithDates }) {
  const upcomingDates = pkg.dates.filter(d => d.is_active);
  const [open, setOpen] = useState(false);

  const handleRegister = async (dateId: number) => {
    try {
      const res = await fetch("/api/classes/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_id: dateId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Unable to start checkout.");
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="border border-cyan-500/25 rounded-2xl overflow-hidden bg-gradient-to-r from-[#0a0a14] to-[#080810]">
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-5 md:p-6">
        {/* Left: label */}
        <div className="flex-shrink-0">
          <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-0.5">Monthly Event</div>
          <h2 className="text-2xl font-black text-white leading-none">The Casting Room</h2>
          <div className="text-3xl font-black text-cyan-400 mt-1">{formatPrice(pkg.price_cents)}</div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px self-stretch bg-white/10 mx-2" />

        {/* Middle: description */}
        <div className="flex-1">
          <p className="text-sm text-white/60 leading-relaxed">
            Monthly mock casting calls. Receive sides, prepare, audition on camera, and receive instructor feedback — just like a real casting session.
          </p>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-cyan-500/70 hover:text-cyan-400 transition-colors mt-2"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? "Hide details" : "What's included"}
          </button>
          {open && (
            <ul className="mt-2 space-y-1">
              {PACKAGE_DETAILS["The Casting Room"].bullets.map(b => (
                <li key={b} className="flex items-start gap-2 text-xs text-white/60">
                  <span className="text-cyan-400 flex-shrink-0">—</span>{b}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: dates or coming soon */}
        <div className="flex-shrink-0 min-w-[180px]">
          {upcomingDates.length > 0 ? (
            <div className="space-y-2">
              {upcomingDates.map(slot => {
                const full = slot.spots_remaining <= 0;
                const canReg = !full && !!pkg.stripe_price_id;
                return (
                  <div key={slot.id} className="flex items-center justify-between gap-3">
                    <div className="text-xs text-white/60">{formatDate(slot.date)}</div>
                    <button
                      onClick={() => canReg && handleRegister(slot.id)}
                      disabled={!canReg}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${full ? "bg-white/10 text-white/30" : !pkg.stripe_price_id ? "bg-white/10 text-white/40" : "bg-[#E8001D] hover:bg-red-700 text-white"}`}
                    >
                      {full ? "Full" : !pkg.stripe_price_id ? "Soon" : "Register"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-cyan-500/30 rounded-xl text-xs text-cyan-400 font-bold tracking-wider">
              COMING SOON
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/classes/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) setStatus("done");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="text-center py-4">
        <div className="text-cyan-400 font-bold text-lg mb-1">You're on the list.</div>
        <div className="text-white/40 text-sm">We'll reach out when the 4-Week Program is ready.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
      />
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-colors text-sm"
      >
        {status === "loading" ? "Joining…" : "Join the Waitlist"}
      </button>
      {status === "error" && <p className="text-red-400 text-xs text-center">Something went wrong. Please try again.</p>}
    </form>
  );
}

export default function ActingClasses() {
  const [packages, setPackages] = useState<PackageWithDates[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPackages(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mainPackages = packages.filter(p => p.name !== "The Casting Room");
  const castingRoom = packages.find(p => p.name === "The Casting Room");

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#050508" }}>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[20%] w-[500px] h-[500px] rounded-full blur-[160px]" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
          <div className="absolute top-0 right-[10%] w-[300px] h-[300px] rounded-full blur-[120px]" style={{ background: "radial-gradient(circle, rgba(232,0,29,0.05) 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan-500/30 rounded-full text-xs text-cyan-400 font-bold tracking-widest uppercase mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Actor Training · The Self-Tape Room
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tight mb-5">
            REAL SKILLS.<br />
            <span className="text-cyan-400">REAL PRACTICE.</span><br />
            REAL OPPORTUNITIES.
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Hands-on training for actors who want to become camera-ready,
            confident, and prepared for real auditions.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-white/30 tracking-widest uppercase">
            <span>Act</span>
            <span className="text-cyan-500/50">·</span>
            <span>Audition</span>
            <span className="text-cyan-500/50">·</span>
            <span>Book</span>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="max-w-5xl mx-auto px-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-xs text-white/30 tracking-widest uppercase">Choose Your Experience</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
      </div>

      {/* Main 4 packages — vertical cards */}
      <div className="max-w-5xl mx-auto px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {mainPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>

            {/* Casting Room banner */}
            {castingRoom && <CastingRoomBanner pkg={castingRoom} />}
          </>
        )}
      </div>

      {/* How it works */}
      <div className="border-t border-white/5 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="text-xl font-black text-center mb-10 tracking-tight">How Registration Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { n: "01", title: "Choose Your Experience", body: "Pick the workshop or service that fits where you are." },
              { n: "02", title: "Pick a Saturday", body: "Select an available date that works for your schedule." },
              { n: "03", title: "Register & Pay", body: "Complete checkout securely through Stripe." },
              { n: "04", title: "Show Up Ready", body: "You'll receive everything you need before your session." },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="text-3xl font-black text-cyan-400/20 mb-2">{step.n}</div>
                <div className="text-sm font-bold mb-1 text-white">{step.title}</div>
                <div className="text-xs text-white/40">{step.body}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/20 tracking-widest uppercase mt-8">Saturdays · 2:00 PM</p>
        </div>
      </div>

      {/* 4-Week Program Waitlist */}
      <div className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
            <div className="relative">
              <div className="inline-block px-2 py-0.5 border border-amber-400/30 rounded text-xs text-amber-400 font-bold tracking-wider uppercase mb-4">
                Coming Soon
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">4-Week Acting + Self-Tape Program</h2>
              <p className="text-white/40 text-sm mb-7">Go deeper. Four weeks of acting-for-camera training, self-tape mastery, and mock casting.</p>
              <div className="grid grid-cols-2 gap-3 mb-7">
                {[
                  { week: "Week 1", title: "Acting for Camera", body: "Natural, believable performances for the screen." },
                  { week: "Week 2", title: "Audition Preparation", body: "Break down sides, make character choices, prepare." },
                  { week: "Week 3", title: "The Self-Tape", body: "Camera, framing, lighting, sound, eyelines, slates." },
                  { week: "Week 4", title: "Mock Casting", body: "Perform. Record. Receive notes. Do it again." },
                ].map(w => (
                  <div key={w.week} className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs text-cyan-400 font-bold mb-0.5">{w.week}</div>
                    <div className="text-sm font-bold text-white mb-0.5">{w.title}</div>
                    <div className="text-xs text-white/40">{w.body}</div>
                  </div>
                ))}
              </div>
              <WaitlistForm />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 py-12 text-center">
        <div className="text-xs text-white/20 tracking-widest uppercase mb-2">ReelMotion</div>
        <div className="text-base font-black mb-1">Your audition starts before you hit record.</div>
        <div className="text-xs text-white/30 tracking-widest">TRAIN · RECORD · IMPROVE · REPEAT</div>
        <Link to="/browse" className="inline-block mt-6 text-xs text-white/20 hover:text-white/50 transition-colors">
          ← Back to ReelMotion
        </Link>
      </div>
    </div>
  );
}
