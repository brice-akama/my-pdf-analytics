import React, { JSX } from "react";

export default function AboutPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div>
          {/* Title */}
          <div className="mb-8 pb-6 border-b">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              About DocMetri
            </h1>
            <p className="text-lg text-slate-600">
              DocMetri is a privacy-first PDF analytics and document intelligence platform that
              helps creators, teams and enterprises understand how people engage with their
              documents. We make static content measurable — from read time to page-level
              engagement, conversions, and developer-friendly integrations.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-slate-700 leading-relaxed">
            {/* Mission + Vision */}
            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Our Mission
            </h2>
            <p>
              We exist to make documents actionable. Many teams lose visibility into how
              their PDFs, reports and proposal files perform — DocMetri turns those files
              into measurable assets so you can optimize content, increase engagement and
              close more business. We prioritize accuracy, privacy and approachable design.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Our Vision
            </h2>
            <p>
              To be the standard platform for document intelligence — where creators and
              organizations get real-time insight into how information is consumed and
              acted upon. We envision a future where every shared document is a channel for
              learning, conversion and continuous improvement.
            </p>

            {/* What we track */}
            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              What DocMetri Measures
            </h2>
            <p>
              <strong>View & Visit Metrics:</strong> Track who opened a document, number of unique views, referral sources and
              session duration to understand reach and discoverability.
            </p>
            <p>
              <strong>Engagement & Read Depth:</strong> Measure time-on-page, page scroll depth and heatmaps to know which parts of
              your PDF capture attention and where users drop off.
            </p>
            <p>
              <strong>Conversion & Actions:</strong> Monitor downloads, link clicks, form submissions and signature events to
              quantify document-driven outcomes and ROI.
            </p>

            {/* How it works */}
            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              How It Works — A Practical Overview
            </h2>
            <p>
              <strong>Upload or link your PDF:</strong> Import files, paste links, or embed
              a tracked viewer link in emails and webpages.
            </p>
            <p>
              <strong>Collect anonymous & optional authenticated signals:</strong> We capture
              non-intrusive, privacy-aware telemetry about reads, clicks and downloads. For
              authenticated workflows we can map activity to users or teams.
            </p>
            <p>
              <strong>Analyze in real time:</strong> View aggregated and page-level metrics,
              compare versions, set alerts for spikes, and export data for BI tools.
            </p>
            <p>
              <strong>Integrate with your stack:</strong> Webhooks, REST APIs, and CSV/JSON
              exports make it easy to connect DocMetri to your pipelines and analytics.
            </p>

            {/* Values */}
            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Our Principles & Values
            </h2>
            <p>
              <strong>Privacy by Design:</strong> We collect the minimum data necessary to provide insights. We follow
              privacy best practices and support anonymized tracking and opt-outs.
            </p>
            <p>
              <strong>Simplicity & Clarity:</strong> Complex analytics should be accessible — our UI and reports focus on usable
              metrics, not noise.
            </p>
            <p>
              <strong>Developer Friendly:</strong> Flexible APIs and webhooks allow developers to automate workflows and
              integrate DocMetri into existing tooling.
            </p>
            <p>
              <strong>Open Roadmap:</strong> We prioritize features based on real user feedback and publish a public
              roadmap so customers know what's coming.
            </p>

            {/* Founder note */}
            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Founder's Note
            </h2>
            <p className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded text-purple-900">
              Hi — I'm the founder of DocMetri. I started this
              project because, as a developer and creator, I wanted to know if my documents
              were actually being read and how readers interacted with them. After seeing
              the gap in available tools, I built DocMetri to be lightweight, secure and
              developer-friendly. I believe powerful analytics should be available to
              everyone, not just big companies.
            </p>
            <p>
              If you have questions, feature requests, or
              feedback, please reach out — we love hearing from early users and iterate
              quickly.
            </p>

            {/* Roadmap */}
            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Where We're Headed (Roadmap)
            </h2>
            <p>
              We're continuously improving DocMetri with new features and capabilities. Our upcoming roadmap includes advanced content heatmaps and per-page attention scoring; AI-driven document summaries and highlights; team-level analytics and usage quotas; integrations with Slack, Notion, Google Drive, and Zapier; and an embedded reader with secure access controls.
            </p>

            {/* Security & Trust */}
            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Security & Trust
            </h2>
            <p>
              We take security seriously. All data in transit is
              encrypted using HTTPS/TLS. Sensitive user data is stored using best practices and
              access is limited by role. We also publish a simple privacy policy and provide
              options for data export and deletion.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Frequently Asked Questions
            </h2>
            <p>
              <strong>Do you track personally identifiable information (PII)?</strong> No — by default we capture anonymized engagement
              metrics. For authenticated workflows, customers may opt into identifying user
              telemetry.
            </p>
            <p>
              <strong>Can I export my data?</strong> Yes — you can export reports and raw
              event data in CSV or JSON format for further analysis.
            </p>
            <p>
              <strong>Is there an API?</strong> Yes — DocMetri exposes a REST API for
              creating tracked links, querying analytics and integrating with your backend.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Get Started with DocMetri
            </h2>
            <p>
              Sign up for a free account and start tracking your first
              document in minutes. No credit card required. For more information about our enterprise features and custom solutions, please <a href="mailto:contact@docmetri.com" className="text-blue-600 hover:underline font-medium">contact our sales team</a>.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                © {new Date().getFullYear()} DocMetri — Document intelligence for the modern web.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}