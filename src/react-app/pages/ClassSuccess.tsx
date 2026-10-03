import { Link } from "react-router";
import { CheckCircle } from "lucide-react";

export default function ClassSuccess() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
        <h1 className="text-2xl font-black mb-3">You're registered!</h1>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Check your email for confirmation details. We'll send you everything you need
          before your session.
        </p>
        <div className="space-y-3">
          <Link
            to="/classes"
            className="block w-full py-3 bg-[#E8001D] hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm"
          >
            View More Classes
          </Link>
          <Link
            to="/browse"
            className="block w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Back to ReelMotion
          </Link>
        </div>
      </div>
    </div>
  );
}
