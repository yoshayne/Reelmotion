
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">

      <div
        className="max-w-2xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">Membership</h2>
            <p>ReelMotion offers monthly and annual community memberships that grant access to our content library. Memberships automatically renew unless cancelled before the renewal date. You may cancel at any time through your account settings, and access continues through the end of your paid period.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Content Access</h2>
            <p>ReelMotion grants you a limited, non-exclusive, non-transferable license to stream content for personal, non-commercial use. You may not download, copy, redistribute, or share your account credentials.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">User Conduct</h2>
            <p>You agree not to use ReelMotion for any unlawful purpose, attempt to circumvent content protection, or interfere with the service's operation. We reserve the right to terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Intellectual Property</h2>
            <p>All content on ReelMotion is owned by or licensed to us. The ReelMotion trademark, logo, and platform design are proprietary. Filmmakers retain ownership of their works; we operate under licensing agreements.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Payments</h2>
            <p>Payments are processed securely by Stripe. We do not store your payment card information. Refunds are handled on a case-by-case basis — contact support within 7 days of a charge for refund consideration.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Changes to Terms</h2>
            <p>We may update these terms and will notify you via email for material changes. Continued use of ReelMotion after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
            <p>Legal inquiries: <a href="mailto:legal@reelmotion.tv" className="text-red-500 hover:text-red-400">legal@reelmotion.tv</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
