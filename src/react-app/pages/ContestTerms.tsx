import { Link } from "react-router";
import Navbar from "@/react-app/components/Navbar";

export default function ContestTermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div
        className="max-w-2xl mx-auto px-4 pb-16"
        style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}
      >
        <Link to="/contest" className="text-sm text-gray-500 hover:text-gray-400 mb-6 inline-block">
          ← Back to Submission
        </Link>
        <h1 className="text-3xl font-black mb-8">Film Submission Terms</h1>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">Eligibility</h2>
            <p>Submissions are open to independent filmmakers worldwide. Films must not have been previously released on major streaming platforms. Short films (under 40 minutes) and feature films are both welcome.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Content Guidelines</h2>
            <p>All submitted content must be original work owned by the submitter. ReelMotion does not accept content that infringes on third-party intellectual property, contains illegal material, or violates our community standards.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Rights & Licensing</h2>
            <p>Submission does not transfer ownership. If selected, we will negotiate a non-exclusive streaming license agreement. You retain all rights to your film. We will never distribute your film without a signed agreement.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Review Process</h2>
            <p>All submissions are reviewed by our curatorial team. The review process typically takes 2–4 weeks. You will be notified via email of the decision regardless of outcome.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Privacy</h2>
            <p>Your film and personal information will only be viewed by the ReelMotion team for evaluation purposes. We will not share your work with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Contact</h2>
            <p>Questions about submissions? Visit our <Link to="/support" className="text-red-500 hover:text-red-400">support page</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
