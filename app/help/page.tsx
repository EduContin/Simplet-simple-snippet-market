// pages/help.tsx

"use client";

import React, { useState } from "react";
import Head from "next/head";

const RuleSection: React.FC<{ title: string; rules: string[] }> = ({
  title,
  rules,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xl font-semibold text-blue-300 flex justify-between items-center">
          {title}
          <svg
            className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </h3>
      </button>
      {isOpen && (
        <div className="mt-2 p-4 bg-gray-800 rounded-lg">
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            {rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

const HelpPage: React.FC = () => {
  const generalRules = [
   "Respect and inclusivity are required. Treat every member equally, regardless of skill level, background, or culture.",
    "Constructive collaboration is encouraged. Provide actionable feedback, credit contributors, and engage in meaningful discussions.",
    "Offensive, discriminatory, or harmful behavior will not be tolerated under any circumstances.",
    "Professional conduct is expected at all times. Communicate as if you were in a professional workplace.",
    "Privacy must be respected. Do not share personal information or private conversations without consent.",
    "Content that promotes hate, harassment, or illegal activity is strictly prohibited and will be removed.",
    "Plagiarism, impersonation, or taking credit for the work of others is not allowed.",
    "Spam, self-promotion without context, or irrelevant advertising is forbidden.",
    "Members should report suspicious or inappropriate behavior to moderators instead of retaliating directly.",
    "Respect cultural and language diversity. Discussions should remain welcoming to a global developer audience.",
    "Multiple accounts for malicious purposes or manipulation of reviews/ratings are prohibited and will be IP banned.,",
    "Collaborations and debates should remain technical, solution-focused, and free from personal attacks.",
  ];

  const postingRules = [
    "All snippets must include clear documentation, usage instructions, and examples.",
    "Code should follow best practices for readability, maintainability, and modularity.",
    "Security is a priority. Snippets must not include malicious, hidden, or harmful logic.",
    "Only upload original code or code you are authorized to share. Plagiarized content is prohibited.",
    "All snippets must pass automated and manual validation checks before publication.",
    "Licenses must be correctly applied. Authors are solely responsible for selecting the appropriate license for their code.",
    "Executable binaries, obfuscated code, or incomplete/non-functional snippets will be rejected.",
    "Copyright and intellectual property rights must be respected. Unauthorized sharing of copyrighted materials is not allowed.",
    "Snippets that intentionally break, exploit, or compromise systems are forbidden.",
    "Content that violates laws, promotes hate, or spreads harmful software will be removed immediately.",
  ];

  const collaborationRules = [
   "Collaboration and co-creation are encouraged. Developers can co-author snippets and share ownership transparently.",
    "Feedback and reviews should be constructive, respectful, and specific.",
    "Enhancement requests should focus on improving snippet quality, security, or usability.",
    "All contributors must be credited fairly for their work.",
    "Taking someone else's snippet, making minor edits, and republishing it without meaningful changes is not allowed.",
    "Open communication between authors and users is encouraged to refine snippets and resolve issues.",
    "Mentorship and knowledge sharing are valued. Experienced developers should support newcomers where possible.",
    "Collaboration must remain professional, transparent, and aimed at mutual growth.",
    "Toxic behavior, gatekeeping, or excluding others from participating will not be tolerated.",
    "Community-driven improvements should be documented clearly so changes are traceable and verifiable.",
  ];

  const communicationRules = [
   "Always use clear, respectful, and professional language when interacting with others.",
    "Feedback should be specific and solution-oriented. Avoid vague comments such as 'it doesn’t work.'",
    "Responses to inquiries and feedback should be timely, especially from snippet authors.",
    "Keep discussions focused on technical and project-related topics.",
    "Use official platform channels (forums, support desk, or messaging) for transparency and accountability.",
    "Profanity, offensive remarks, or harassment of any kind will not be tolerated.",
    "Spam, irrelevant advertising, or disruptive self-promotion is forbidden.",
    "Bug reports should be submitted clearly with reproducible steps when possible.",
    "Respect cultural and linguistic diversity. Communication should remain inclusive and welcoming to a global audience.",
    "Trust and professionalism are built through transparency, honesty, and clarity in communication.",
  ];

  return (
  <div className="container mx-auto px-4 py-8">
      <Head>
        <title>VEC Platform - Help & Information</title>
        <meta
          name="description"
          content="Help and information for VEC learning platform"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-100">
          Welcome to Simplet
        </h1>

  <nav className="mb-6 p-6 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg github-shadow">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">
            Table of Contents
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li>
              <a href="#about-us" className="text-blue-400 hover:underline">
                About Our Platform
              </a>
            </li>
            <li>
              <a
                href="#general-rules"
                className="text-blue-400 hover:underline"
              >
                Community Guidelines
              </a>
            </li>
            <li>
              <a
                href="#posting-rules"
                className="text-blue-400 hover:underline"
              >
                Content Guidelines
              </a>
            </li>
            <li>
              <a
                href="#collaboration-rules"
                className="text-blue-400 hover:underline"
              >
                Collaboration Guidelines
              </a>
            </li>
            <li>
              <a
                href="#communication-rules"
                className="text-blue-400 hover:underline"
              >
                Communication Guidelines
              </a>
            </li>
            <li>
              <a
                href="#verification-badge"
                className="text-blue-400 hover:underline"
              >
                Verification Badge
              </a>
            </li>
          </ul>
        </nav>

        <section id="about-us" className="mb-6 bg-gray-800/90 backdrop-blur-sm p-6 border border-gray-700 rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">
            About Our Platform
          </h2>
        <p className="text-gray-300 mb-4">
  Simplet is a <span className="text-white font-semibold"> dedicated marketplace for modular code snippets</span>, 
  designed to help developers, teams, and organizations accelerate their projects without compromising on quality. 
  Instead of rewriting the same pieces of code again and again, you can 
   <span className="text-white font-semibold"> search, purchase, and share ready-to-use, tested, and documented snippets</span>  across multiple technologies. 
    
</p>

<p className="text-gray-300 mb-4">
  We provide a <span className="text-white font-semibold">safe and professional environment</span> where creators can monetize their work 
  by publishing code components that are reusable, modular, and easy to integrate.  
  Buyers and contributors benefit from:  
</p>

<ul className="list-disc list-inside text-gray-300 mb-4">
  <li><span className="text-white font-semibold">Time savings</span> and less repetitive coding</li>
  <li><span className="text-white font-semibold">Reduced development costs</span> through reusable solutions</li>
  <li><span className="text-white font-semibold">Access to community-validated code</span> that is reliable and secure</li>
</ul>

<p className="text-gray-300 mb-4">
  <span className="text-white font-semibold">Key highlights of our platform include:</span>
</p>

<ul className="list-disc list-inside text-gray-300 mb-4">
  <li><span className="text-white font-semibold">Curated libraries:</span> every snippet is reviewed for security, performance, and usability.</li>
  <li><span className="text-white font-semibold">Community-driven growth:</span> developers can interact, review, and improve snippets together.</li>
  <li><span className="text-white font-semibold">Monetization options:</span> authors can provide free snippets, sell them at a fair price, or release them under open licenses.</li>

</ul>

<p className="text-gray-300 mb-4">
  Our mission is to create a <span className="text-white font-semibold">collaborative and sustainable ecosystem</span> 
  where code is not only a tool, but also an <span className="text-white font-semibold">asset that can be valued, reused, and evolved collectively</span>.
</p>

        </section>

        <section id="general-rules" className="mb-6 bg-gray-800/90 backdrop-blur-sm p-6 border border-gray-700 rounded-lg">
          <h2 id="general-rules" className="text-2xl font-semibold mb-3 text-gray-100">Platform Guidelines</h2>
          <RuleSection title="Community Guidelines" rules={generalRules} />
          <RuleSection title="Content Guidelines" rules={postingRules} />
          <RuleSection title="Collaboration Guidelines" rules={collaborationRules} />
          <RuleSection title="Communication Guidelines" rules={communicationRules} />
        </section>

        <section className="mb-6 bg-gray-800/90 backdrop-blur-sm p-6 border border-gray-700 rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">
            Terms of Service
          </h2>
         <ol className="list-decimal list-inside text-gray-300">
  <li>
    The platform reserves the right to update or modify these Terms of Service 
    at any time, with reasonable notice provided to users.
  </li>
  <li>
    All code snippets, documentation, and user contributions are subject to 
    intellectual property laws and the licensing terms selected by the author.
  </li>
  <li>
    Users are responsible for ensuring that any content they upload is original 
    or properly licensed. Plagiarized or unauthorized content is strictly prohibited.
  </li>
  <li>
    The platform may suspend or terminate accounts that violate these Terms, 
    including cases of abuse, impersonation, or malicious activity.
  </li>
  <li>
    Snippets must not contain harmful, malicious, or insecure code. 
    Any attempt to distribute malware or exploit vulnerabilities will result in removal 
    and possible legal action.
  </li>
  <li>
    Users are responsible for maintaining the confidentiality and security of their login credentials. 
    Sharing accounts or using multiple accounts for malicious purposes is forbidden.
  </li>
  <li>
    The platform provides no guarantee that uploaded snippets will generate revenue. 
    Monetization depends on user adoption, pricing, and community engagement.
  </li>
  <li>
    The platform is not liable for damages, losses, or disputes resulting from the use 
    of third-party code. All snippets are provided “as is” and at the user’s own risk.
  </li>
  <li>
    Commercial use, redistribution, or modification of snippets must comply 
    with the licensing terms specified by the author.
  </li>
  <li>
    By using this platform, users agree to follow all applicable laws, 
    respect the rights of other developers, and comply with these Terms of Service.
  </li>
</ol>

        </section>

        <section id="verification-badge" className="mb-6 bg-gray-800/90 backdrop-blur-sm p-6 border border-gray-700 rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">Verification Badge</h2>
          <p className="text-gray-300 mb-3">Snippets that follow the platform's Code Standards may receive a verification badge from Admins. This badge signals quality and increases discoverability.</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Admin-only: only platform Admins can grant or revoke the badge.</li>
            <li>Criteria: documentation completeness, runnable example, security basics, clear licensing.</li>
            <li>Revocation: if the snippet stops complying, the badge can be removed.</li>
          </ul>
          <p className="text-gray-400 text-sm mt-3">See the full policy: <a href="/legal/code-standards" className="text-blue-400 hover:underline">Code Standards & Verification Policy</a>.</p>
        </section>

        <section className="mb-6 bg-gray-800/90 backdrop-blur-sm p-6 border border-gray-700 rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">
            Contact Us
          </h2>
          <p className="text-gray-300">
            For technical support, academic assistance, or general inquiries, please contact us at:{" "}
            <a
              href="mailto:support@vec-platform.dev"
              className="text-blue-400 hover:underline"
            >
              support@simplet-platform.dev
            </a>
          </p>
          <p className="mt-4 p-4 bg-blue-900/50 border border-blue-900 text-gray-300 rounded-lg italic">
            For urgent matters or emergency situations, please contact your 
            code provider directly or use your institution's emergency communication channels.
          </p>
        </section>
      </main>
    </div>
  );
};

export default HelpPage;
