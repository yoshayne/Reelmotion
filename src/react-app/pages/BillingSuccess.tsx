import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import { CheckCircle, Film, Users, Zap, Heart } from "lucide-react";

export default function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (!sessionId) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          window.location.href = "/browse";
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [sessionId]);

  const benefits = [
    { icon: Film, text: "Unlimited access to all films and series" },
    { icon: Zap, text: "Early access to new releases" },
    { icon: Users, text: "Filmmaker Q&As and community events" },
    { icon: Heart, text: "Support independent film culture" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div
        className="flex flex-col items-center justify-center min-h-screen px-4 text-center"
        style={{ paddingTop: "max(env(safe-area-inset-top), 3.5rem)" }}
      >
        <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-4xl font-black mb-2">Welcome to the Community</h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          Your membership is now active. Start watching and exploring independent film culture.
        </p>

        <div className="space-y-3 mb-8 w-full max-w-sm">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-3 bg-gray-900/50 border border-green-600/20 rounded-xl">
              <Icon className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">{text}</span>
            </div>
          ))}
        </div>

        <Link
          to="/browse"
          className="px-8 py-3.5 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg transition-colors mb-4"
        >
          Start Watching
        </Link>

        {sessionId && (
          <p className="text-sm text-gray-600">
            Redirecting in {countdown}s...
          </p>
        )}
      </div>
    </div>
  );
}
