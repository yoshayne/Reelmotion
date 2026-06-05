import { Link } from "react-router";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 5rem)" }}>
        <Link to="/browse" className="text-sm text-gray-500 hover:text-gray-400 mb-6 inline-block">← Back to Browse</Link>

        <div className="mb-2">
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Watch The Culture</p>
        </div>
        <h1 className="text-3xl font-black mb-2">Community Guidelines</h1>
        <div className="h-0.5 w-12 mb-8" style={{ backgroundColor: '#E8001D' }} />

        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Welcome to the Watch The Culture community. To keep this space respectful and focused on independent film culture, all members are expected to follow these guidelines when commenting.
        </p>

        <div className="space-y-6">
          {[
            {
              num: "01",
              title: "Be respectful.",
              body: "Critique the work, not the person. Harassment, personal attacks, and hate speech of any kind will result in immediate removal and account suspension.",
            },
            {
              num: "02",
              title: "No hate speech.",
              body: "Comments containing slurs, discriminatory language, or content targeting someone's race, ethnicity, gender, sexuality, religion, or disability are strictly prohibited.",
            },
            {
              num: "03",
              title: "No spoilers without warning.",
              body: 'If your comment contains plot spoilers, start it with "SPOILER:" so other members can choose to skip it.',
            },
            {
              num: "04",
              title: "Stay on topic.",
              body: "Keep comments related to the film, filmmaker, or culture being discussed.",
            },
            {
              num: "05",
              title: "No spam or self-promotion.",
              body: "Do not post links, ads, or repeated content.",
            },
            {
              num: "06",
              title: "No illegal content.",
              body: "Do not post anything that violates applicable laws.",
            },
          ].map(({ num, title, body }) => (
            <div key={num} className="flex gap-5 p-5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="font-black text-sm flex-shrink-0 mt-0.5" style={{ color: '#E8001D' }}>{num}</span>
              <div>
                <p className="font-bold text-sm mb-1">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-xl" style={{ backgroundColor: 'rgba(232,0,29,0.06)', border: '1px solid rgba(232,0,29,0.15)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Violations are subject to comment removal and account suspension at the sole discretion of the Watch The Culture team. These guidelines may be updated at any time.
          </p>
          <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            For concerns or to report a comment, contact us at{" "}
            <a href="mailto:support@reelmotion.tv" style={{ color: '#E8001D' }}>support@reelmotion.tv</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
