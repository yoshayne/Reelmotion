import Navbar from "@/react-app/components/Navbar";
import { Link } from "react-router";
import { Mail, MessageCircle, Film } from "lucide-react";

export default function SupportPage() {
  const faqs = [
    {
      q: "How do I become a member?",
      a: "Visit the Join the Community page and choose between Monthly or Annual membership. Complete checkout via Stripe — your access is activated instantly.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Use the Manage Membership link in your Account page to access the Stripe portal and cancel. You'll retain access until the end of your billing period.",
    },
    {
      q: "What devices can I watch on?",
      a: "ReelMotion works on any modern web browser on desktop, tablet, or mobile. You can also add it to your home screen for a native app-like experience.",
    },
    {
      q: "How do I submit my film?",
      a: "Visit the Submit Film page to send us your film details, viewing link, and contact information. Our team reviews all submissions.",
    },
    {
      q: "How do I update my payment method?",
      a: "Go to Account → Manage Membership to access the Stripe Customer Portal where you can update your payment details.",
    },
    {
      q: "I'm having technical issues with playback.",
      a: "Try refreshing the page or clearing your browser cache. If the issue persists, email us at support@reelmotion.tv with the film name and what device/browser you're using.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div
        className="max-w-2xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <h1 className="text-3xl font-black mb-2">Support</h1>
        <p className="text-gray-400 mb-10">How can we help you?</p>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <a
            href="mailto:support@reelmotion.tv"
            className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-red-600/40 transition-colors text-center group"
          >
            <Mail className="w-7 h-7 text-red-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-sm">Email Us</p>
            <p className="text-xs text-gray-500 mt-1">support@reelmotion.tv</p>
          </a>
          <Link
            to="/contest"
            className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-red-600/40 transition-colors text-center group"
          >
            <Film className="w-7 h-7 text-red-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-sm">Submit Film</p>
            <p className="text-xs text-gray-500 mt-1">Join our library</p>
          </Link>
          <Link
            to="/account"
            className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-red-600/40 transition-colors text-center group"
          >
            <MessageCircle className="w-7 h-7 text-red-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-sm">Account Help</p>
            <p className="text-xs text-gray-500 mt-1">Billing & settings</p>
          </Link>
        </div>

        {/* FAQs */}
        <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <summary className="px-5 py-4 font-medium text-sm cursor-pointer hover:text-red-400 transition-colors list-none flex items-center justify-between gap-3">
                {q}
                <span className="text-gray-600 group-open:rotate-180 transition-transform flex-shrink-0">▼</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-800">
                {a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
