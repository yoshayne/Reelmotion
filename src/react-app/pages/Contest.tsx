import { useState } from "react";
import { Link } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { Film, CheckCircle } from "lucide-react";

interface FormData {
  film_title: string;
  runtime: string;
  genre: string;
  viewing_link: string;
  password: string;
  trailer_link: string;
  director_name: string;
  email: string;
}

const GENRES = ["Drama", "Comedy", "Documentary", "Thriller", "Horror", "Action", "Sci-Fi", "Romance", "Animation", "Other"];

export default function ContestPage() {
  const [form, setForm] = useState<FormData>({
    film_title: "", runtime: "", genre: "", viewing_link: "",
    password: "", trailer_link: "", director_name: "", email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          password: form.password || undefined,
          trailer_link: form.trailer_link || undefined,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div
          className="flex flex-col items-center justify-center min-h-screen px-4 text-center"
          style={{ paddingTop: "max(env(safe-area-inset-top), 3.5rem)" }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-black mb-2">Submission Received!</h1>
          <p className="text-gray-400 mb-8 max-w-sm">
            Thank you for submitting your film. We'll review it and get back to you at {form.email}.
          </p>
          <Link
            to="/browse"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div
        className="max-w-lg mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
            <Film className="w-5 h-5 text-red-500" />
          </div>
          <h1 className="text-2xl font-black">Submit Your Film</h1>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Submit your independent film to be featured on ReelMotion.{" "}
          <Link to="/contest/terms" className="text-red-500 hover:text-red-400">
            View submission terms
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Film Title *</label>
            <input
              name="film_title"
              value={form.film_title}
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Runtime *</label>
              <input
                name="runtime"
                value={form.runtime}
                onChange={handleChange}
                required
                placeholder="e.g. 92 min"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Genre *</label>
              <select
                name="genre"
                value={form.genre}
                onChange={handleChange}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
              >
                <option value="">Select genre</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Viewing Link (Vimeo/Drive) *</label>
            <input
              name="viewing_link"
              type="url"
              value={form.viewing_link}
              onChange={handleChange}
              required
              placeholder="https://vimeo.com/..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password (if protected)</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Trailer Link (optional)</label>
            <input
              name="trailer_link"
              type="url"
              value={form.trailer_link}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Director Name *</label>
            <input
              name="director_name"
              value={form.director_name}
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-600/40 rounded-xl text-sm text-red-300">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-500">
            By submitting you agree to the{" "}
            <Link to="/contest/terms" className="text-red-500">submission terms</Link>.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-xl font-bold transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Film"}
          </button>
        </form>
      </div>
    </div>
  );
}
