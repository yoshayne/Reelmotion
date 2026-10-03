import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Camera, Film, Package, User, Theater, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { ActingClassPackage, ActingClassDate } from "@/shared/types";

type PackageWithDates = ActingClassPackage & { dates: ActingClassDate[] };

const PACKAGE_ICONS: Record<string, typeof Camera> = {
  "Self-Tape Audition Workshop": Camera,
  "Workshop + Professional Self-Tape": Film,
  "Actor Starter Package": Package,
  "1-on-1 Premium Self-Tape Session": User,
  "The Casting Room": Theater,
};

const PACKAGE_DETAILS: Record<string, { tagline: string; learn?: string[]; includes?: string[]; leave?: string[]; extra?: string }> = {
  "Self-Tape Audition Workshop": {
    tagline: "Learn the fundamentals of auditioning on camera and creating stronger self-tapes.",
    learn: [
      "Breaking down audition sides", "Making strong character choices", "Acting naturally for camera",
      "Camera positioning & framing", "Eyelines & blocking", "Lighting basics", "Sound & recording basics",
      "Slate technique", "What to wear for a self-tape", "Common self-tape mistakes",
      "Live audition exercises", "Instructor feedback",
    ],
    leave: ["A better understanding of how to prepare and perform a professional self-tape audition."],
  },
  "Workshop + Professional Self-Tape": {
    tagline: "Take what you learned and put it into practice.",
    extra: "Everything included in the Workshop, PLUS a professionally recorded self-tape.",
    includes: [
      "Self-tape audition workshop", "Scene preparation", "On-camera performance",
      "Professional camera setup", "Professional lighting", "Professional audio",
      "Multiple takes", "Final self-tape recording",
    ],
  },
  "Actor Starter Package": {
    tagline: "TRAIN. RECORD. GET CAMERA READY.",
    extra: "A complete starter package for actors building their audition materials.",
    includes: [
      "Self-tape audition workshop",
      "Professional self-tape recording",
      "3 professionally captured & edited headshots",
    ],
    leave: [
      "Acting & audition training",
      "A professional self-tape",
      "3 professionally edited headshots",
    ],
  },
  "1-on-1 Premium Self-Tape Session": {
    tagline: "Don't just record your audition. Get coached through it.",
    extra: "A private session built around your specific audition.",
    includes: [
      "Audition preparation", "Script/side breakdown", "Character development",
      "Performance coaching", "Camera positioning", "Lighting",
      "Professional recording", "Multiple takes", "Performance feedback", "Final self-tape",
    ],
  },
  "The Casting Room": {
    tagline: "STEP INTO THE ROOM.",
    extra: "A recurring mock-casting experience designed to give actors realistic audition practice.",
    includes: [
      "Mock casting experience", "Audition sides provided", "Recorded audition",
      "Performance practice", "Instructor feedback",
    ],
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatPrice(cents: number) {
  return `$${Math.floor(cents / 100)}`;
}

function DateCard({ slot, pkg, onRegister }: { slot: ActingClassDate; pkg: PackageWithDates; onRegister: (dateId: number) => void }) {
  const [loading, setLoading] = useState(false);
  const full = slot.spots_remaining <= 0;
  const lowSpots = slot.spots_remaining > 0 && slot.spots_remaining <= 3;
  const canRegister = !full && !!pkg.stripe_price_id;

  const handleClick = async () => {
    if (!canRegister) return;
    setLoading(true);
    try { await onRegister(slot.id); } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 gap-4">
      <div>
        <div className="font-semibold text-sm">{formatDate(slot.date)}</div>
        <div className="text-xs text-zinc-400 mt-0.5">{slot.time}</div>
        {full ? (
          <div className="text-xs text-red-500 mt-1 font-medium">Sold out</div>
        ) : lowSpots ? (
          <div className="text-xs text-amber-400 mt-1 font-medium">{slot.spots_remaining} spot{slot.spots_remaining !== 1 ? "s" : ""} left</div>
        ) : (
          <div className="text-xs text-zinc-500 mt-1">{slot.spots_remaining} spots available</div>
        )}
      </div>
      <button
        onClick={handleClick}
        disabled={!canRegister || loading}
        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors
          ${full ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" :
            !pkg.stripe_price_id ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" :
            "bg-[#E8001D] hover:bg-red-700 text-white"}`}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {full ? "Full" : !pkg.stripe_price_id ? "Coming Soon" : `Register — ${formatPrice(pkg.price_cents)}`}
      </button>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackageWithDates }) {
  const [open, setOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const detail = PACKAGE_DETAILS[pkg.name] ?? {};
  const Icon = PACKAGE_ICONS[pkg.name] ?? Camera;
  const upcomingDates = pkg.dates.filter(d => d.is_active);

  const handleRegister = async (dateId: number) => {
    setRegistering(true);
    try {
      const res = await fetch("/api/classes/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_id: dateId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Unable to start checkout. Please try again.");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const isPrivate = pkg.name === "1-on-1 Premium Self-Tape Session";

  return (
    <div className="border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8001D]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#E8001D]" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">{pkg.name}</h2>
              <div className="text-2xl font-black text-[#E8001D] mt-0.5">{formatPrice(pkg.price_cents)}</div>
            </div>
          </div>
        </div>

        {detail.tagline && (
          <p className="text-zinc-300 text-sm mb-3">{detail.tagline}</p>
        )}
        {detail.extra && (
          <p className="text-zinc-400 text-sm mb-3">{detail.extra}</p>
        )}

        {/* Collapsible details */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {open ? "Hide details" : "View what's included"}
        </button>

        {open && (
          <div className="mb-4 space-y-3">
            {detail.learn && (
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">You'll Learn</div>
                <ul className="space-y-1">
                  {detail.learn.map(item => (
                    <li key={item} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-[#E8001D] mt-0.5">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.includes && (
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Includes</div>
                <ul className="space-y-1">
                  {detail.includes.map(item => (
                    <li key={item} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-[#E8001D] mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.leave && (
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">You'll Leave With</div>
                <ul className="space-y-1">
                  {detail.leave.map(item => (
                    <li key={item} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-[#E8001D] mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        {!isPrivate && (
          <div>
            {upcomingDates.length > 0 ? (
              <div className="space-y-2">
                {upcomingDates.map(slot => (
                  <DateCard key={slot.id} slot={slot} pkg={pkg} onRegister={handleRegister} />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500">
                No upcoming dates — check back soon.
              </div>
            )}
          </div>
        )}

        {isPrivate && (
          <a
            href="mailto:romediastudios@gmail.com?subject=1-on-1 Private Session Request"
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8001D] hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Book Your Private Session — {formatPrice(pkg.price_cents)}
          </a>
        )}
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
        <div className="text-green-400 font-bold text-lg mb-1">You're on the list.</div>
        <div className="text-zinc-400 text-sm">We'll reach out when the 4-Week Program is ready.</div>
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
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8001D]"
      />
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8001D]"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-sm"
      >
        {status === "loading" ? "Joining…" : "Join the Waitlist"}
      </button>
      {status === "error" && <p className="text-red-500 text-xs text-center">Something went wrong. Please try again.</p>}
    </form>
  );
}

export default function ActingClasses() {
  const [packages, setPackages] = useState<PackageWithDates[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes")
      .then(r => r.json() as Promise<PackageWithDates[]>)
      .then(setPackages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full blur-[120px]" style={{ backgroundColor: "rgba(232,0,29,0.07)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-block px-3 py-1 bg-[#E8001D]/10 border border-[#E8001D]/30 rounded-full text-xs text-[#E8001D] font-bold tracking-widest uppercase mb-6">
            Actor Training &amp; Self-Tape
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
            Stop guessing.<br />
            <span className="text-[#E8001D]">Start auditioning.</span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
            Hands-on training for actors who want to become more confident,
            camera-ready, and prepared for real auditions.
          </p>
        </div>
      </div>

      {/* Packages */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#E8001D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-900 mt-4">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h2 className="text-xl font-black text-center mb-8">How Registration Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: "01", title: "Choose Your Experience", body: "Select the workshop or service you want." },
              { n: "02", title: "Choose Your Saturday", body: "Pick an available date that works for you." },
              { n: "03", title: "Register & Pay", body: "Complete your registration securely through Stripe." },
              { n: "04", title: "Show Up Ready", body: "You'll receive everything you need before your session." },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="text-3xl font-black text-[#E8001D]/30 mb-2">{step.n}</div>
                <div className="text-sm font-bold mb-1">{step.title}</div>
                <div className="text-xs text-zinc-500">{step.body}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-600 mt-6">SATURDAYS · 2:00 PM</p>
        </div>
      </div>

      {/* 4-Week Program Waitlist */}
      <div className="border-t border-zinc-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <div className="inline-block px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded text-xs text-amber-400 font-bold tracking-wider uppercase mb-4">
              Coming Soon
            </div>
            <h2 className="text-2xl font-black mb-2">4-Week Acting + Self-Tape Program</h2>
            <p className="text-zinc-400 text-sm mb-6">Go beyond the one-day workshop. Four weeks of deeper acting-for-camera and self-tape training.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { week: "Week 1", title: "Acting for Camera", body: "Natural, believable performances for the screen." },
                { week: "Week 2", title: "Audition Preparation", body: "Break down sides, make character choices, prepare." },
                { week: "Week 3", title: "The Self-Tape", body: "Camera, framing, lighting, sound, eyelines, slates." },
                { week: "Week 4", title: "Mock Casting", body: "Perform. Record. Receive notes. Do it again." },
              ].map(w => (
                <div key={w.week} className="bg-zinc-900 rounded-xl p-3">
                  <div className="text-xs text-[#E8001D] font-bold mb-1">{w.week}</div>
                  <div className="text-sm font-bold mb-1">{w.title}</div>
                  <div className="text-xs text-zinc-500">{w.body}</div>
                </div>
              ))}
            </div>
            <WaitlistForm />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-zinc-900 py-12 text-center">
        <div className="text-xs text-zinc-600 tracking-widest uppercase mb-2">ReelMotion</div>
        <div className="text-lg font-black mb-1">Your audition starts before you hit record.</div>
        <div className="text-sm text-zinc-500">TRAIN. RECORD. IMPROVE. REPEAT.</div>
        <Link to="/browse" className="inline-block mt-6 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          Back to ReelMotion
        </Link>
      </div>
    </div>
  );
}
