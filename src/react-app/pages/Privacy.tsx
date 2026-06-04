import Navbar from "@/react-app/components/Navbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div
        className="max-w-2xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">Information We Collect</h2>
            <p>We collect information you provide directly, including your name, email address, and payment information when you join. We also collect usage data such as videos watched and playback history to improve your experience.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>To provide and maintain the ReelMotion service</li>
              <li>To process your membership payments via Stripe</li>
              <li>To personalize your viewing experience</li>
              <li>To communicate important updates about your account</li>
              <li>To improve our platform and curate better content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Third-Party Services</h2>
            <p>We use Clerk for authentication, Stripe for payment processing, and Mux for video delivery. Each of these services has their own privacy policies governing their data practices. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time through the Account settings page.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Cookies</h2>
            <p>We use essential cookies to maintain your session and preferences. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
            <p>For privacy inquiries, contact us at <a href="mailto:privacy@reelmotion.tv" className="text-red-500 hover:text-red-400">privacy@reelmotion.tv</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
