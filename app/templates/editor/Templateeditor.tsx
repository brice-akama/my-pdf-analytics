"use client";

import { useState, useRef, useCallback , useEffect} from "react";
import { useSearchParams } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type TemplateId =
  | "website-design"
  | "copywriting-retainer"
  | "digital-marketing"
  | "consulting";

type Deliverable = { id: string; text: string };
type PricingRow = { label: string; amount: string };
type TimelineRow = { period: string; task: string };

interface WebsiteDesignFields {
  preparedBy: string;
  preparedFor: string;
  date: string;
  validUntil: string;
  projectUnderstanding: string;
  projectGoal: string;
  deliverables: Deliverable[];
  pricingRows: PricingRow[];
  timelineRows: TimelineRow[];
  nextSteps: string;
  yourEmail: string;
}

interface CopywritingRetainerFields {
  yourName: string;
  clientName: string;
  startDate: string;
  term: string;
  scopeDescription: string;
  monthlyFee: string;
  paymentDueDays: string;
  lateFeeRate: string;
  revisionsCount: string;
  clientResponsibilities: string;
  noticeDays: string;
  yourEmail: string;
  yourPhone: string;
}

interface DigitalMarketingFields {
  agencyName: string;
  clientName: string;
  date: string;
  validUntil: string;
  executiveSummary: string;
  problemDescription: string;
  costOfInaction: string;
  phase1: string;
  phase2: string;
  phase3: string;
  outcome1: string;
  outcome2: string;
  outcome3: string;
  monthlyFee: string;
  minimumTerm: string;
  caseStudyClient: string;
  caseStudyChallenge: string;
  caseStudyResult: string;
  startDate: string;
  contactInfo: string;
  yourEmail: string;
}

interface ConsultingFields {
  yourName: string;
  clientName: string;
  date: string;
  proposalRef: string;
  expertise: string;
  clientType: string;
  outcome: string;
  credential1: string;
  credential2: string;
  credential3: string;
  problemDiagnosis: string;
  costOfInaction: string;
  phase1Activities: string;
  phase1Deliverables: string;
  phase1Duration: string;
  phase2Activities: string;
  phase2Deliverables: string;
  phase2Duration: string;
  phase3Activities: string;
  phase3Deliverables: string;
  phase3Duration: string;
  phase4Activities: string;
  phase4Deliverables: string;
  phase4Duration: string;
  fee1: string;
  fee2: string;
  fee3: string;
  fee4: string;
  totalFee: string;
  roiArgument: string;
  roiPercentage: string;
  noticeDays: string;
  dayRate: string;
  estimatedExpenses: string;
  yourEmail: string;
  yourPhone: string;
  yourAvailability: string;
}

// ── Template definitions ──────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "website-design" as TemplateId,
    title: "Website Design Proposal",
    desc: "For freelance web designers and developers",
  },
  {
    id: "copywriting-retainer" as TemplateId,
    title: "Copywriting Retainer Contract",
    desc: "For freelance copywriters and content creators",
  },
  {
    id: "digital-marketing" as TemplateId,
    title: "Digital Marketing Agency Proposal",
    desc: "For digital marketing agencies and consultants",
  },
  {
    id: "consulting" as TemplateId,
    title: "Consulting Services Proposal",
    desc: "For independent consultants and advisors",
  },
];

// ── Default field values ──────────────────────────────────────────────────────

const defaultWebsite: WebsiteDesignFields = {
  preparedBy: "",
  preparedFor: "",
  date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  validUntil: "",
  projectUnderstanding: "",
  projectGoal: "",
  deliverables: [
    { id: "1", text: "Custom website design — up to 6 pages" },
    { id: "2", text: "Mobile responsive layout for all screen sizes" },
    { id: "3", text: "Contact form with email notification setup" },
    { id: "4", text: "Basic SEO setup including page titles and meta descriptions" },
    { id: "5", text: "Two rounds of design revisions" },
    { id: "6", text: "30 days of post-launch support" },
  ],
  pricingRows: [
    { label: "Essential — up to 3 pages, 1 revision round", amount: "" },
    { label: "Professional — up to 6 pages, 2 revision rounds, SEO", amount: "" },
    { label: "Complete — up to 10 pages, 3 revision rounds, 60-day support", amount: "" },
  ],
  timelineRows: [
    { period: "Week 1", task: "Discovery and sitemap planning" },
    { period: "Week 2", task: "Design concepts and initial review" },
    { period: "Week 3", task: "Revisions and development begins" },
    { period: "Week 4", task: "Development complete, testing across devices" },
    { period: "Week 5", task: "Launch and 30-day support period begins" },
  ],
  nextSteps: "To move forward sign and return this proposal and I will send your onboarding questionnaire and invoice within 24 hours. Work begins as soon as the deposit is received.",
  yourEmail: "",
};

const defaultCopywriting: CopywritingRetainerFields = {
  yourName: "",
  clientName: "",
  startDate: "",
  term: "3 months",
  scopeDescription: "",
  monthlyFee: "",
  paymentDueDays: "14",
  lateFeeRate: "1.5% per month",
  revisionsCount: "two",
  clientResponsibilities: "",
  noticeDays: "30",
  yourEmail: "",
  yourPhone: "",
};

const defaultDigitalMarketing: DigitalMarketingFields = {
  agencyName: "",
  clientName: "",
  date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  validUntil: "",
  executiveSummary: "",
  problemDescription: "",
  costOfInaction: "",
  phase1: "Discovery, audit of current performance, competitive analysis, setup of tracking and reporting infrastructure",
  phase2: "Full campaign execution, content production, channel management, weekly performance reviews",
  phase3: "Data-driven optimisation, budget reallocation to best-performing channels, scaling",
  outcome1: "",
  outcome2: "",
  outcome3: "",
  monthlyFee: "",
  minimumTerm: "3 months",
  caseStudyClient: "",
  caseStudyChallenge: "",
  caseStudyResult: "",
  startDate: "",
  contactInfo: "",
  yourEmail: "",
};

const defaultConsulting: ConsultingFields = {
  yourName: "",
  clientName: "",
  date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  proposalRef: "PROP-001",
  expertise: "",
  clientType: "",
  outcome: "",
  credential1: "",
  credential2: "",
  credential3: "",
  problemDiagnosis: "",
  costOfInaction: "",
  phase1Activities: "Stakeholder interviews, data review, process mapping",
  phase1Deliverables: "Diagnostic report with findings and recommendations",
  phase1Duration: "2 weeks",
  phase2Activities: "Solution design, stakeholder alignment, planning",
  phase2Deliverables: "Implementation roadmap and change plan",
  phase2Duration: "2 weeks",
  phase3Activities: "Hands-on implementation, team coaching, iteration",
  phase3Deliverables: "Working solution embedded in your organisation",
  phase3Duration: "4 to 8 weeks",
  phase4Activities: "Documentation, training, transition support",
  phase4Deliverables: "Full documentation and trained internal owner",
  phase4Duration: "1 week",
  fee1: "",
  fee2: "",
  fee3: "",
  fee4: "",
  totalFee: "",
  roiArgument: "",
  roiPercentage: "",
  noticeDays: "14",
  dayRate: "",
  estimatedExpenses: "",
  yourEmail: "",
  yourPhone: "",
  yourAvailability: "",
};

// ── CSS for printed / preview document ───────────────────────────────────────

const DOC_STYLE = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'EB Garamond',Georgia,serif;color:#111;background:#fff;font-size:13.5px;line-height:1.75;}
    .page{max-width:720px;margin:0 auto;padding:64px 56px;}
    .cover{padding-bottom:36px;margin-bottom:36px;border-bottom:2px solid #111;}
    .cover h1{font-family:'DM Sans',sans-serif;font-size:26px;font-weight:600;color:#111;margin-bottom:4px;letter-spacing:-.3px;}
    .cover .sub{font-size:14px;color:#666;margin-bottom:28px;}
    .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .meta-item label{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#999;display:block;margin-bottom:2px;}
    .meta-item span{font-size:13.5px;color:#111;}
    h2{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#111;margin:32px 0 8px;padding-bottom:4px;border-bottom:1px solid #e5e5e5;}
    p{margin-bottom:10px;color:#333;}
    ul{list-style:none;padding:0;margin:0 0 12px;}
    ul li{padding:6px 0;border-bottom:1px solid #f5f5f5;font-size:13.5px;color:#333;display:flex;gap:10px;align-items:flex-start;}
    ul li::before{content:"—";color:#999;flex-shrink:0;margin-top:1px;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;}
    table th{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#999;text-align:left;padding:8px 0;border-bottom:2px solid #e5e5e5;}
    table td{padding:10px 0;border-bottom:1px solid #f5f5f5;font-size:13.5px;color:#333;vertical-align:top;}
    table td.right{text-align:right;font-weight:600;}
    .clause{padding:12px 16px;border-left:2px solid #111;margin-bottom:12px;background:#fafafa;}
    .clause strong{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#666;display:block;margin-bottom:3px;}
    .clause p{margin:0;font-size:13px;}
    .highlight-box{background:#f9f9f9;border-radius:4px;padding:18px 22px;margin:12px 0;}
    .sig-block{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:48px;padding-top:28px;border-top:1px solid #e5e5e5;}
    .sig-line{border-bottom:1px solid #111;height:40px;margin-bottom:6px;}
    .sig-label{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#999;}
     .sig-name{font-size:12px;color:#666;margin-top:4px;}
.sig-date{font-size:12px;color:#333;margin-top:4px;}
    .docmetrics-footer{margin-top:56px;padding:14px 18px;border:1px solid #e5e5e5;border-radius:4px;font-family:'DM Sans',sans-serif;font-size:11px;color:#999;line-height:1.6;}
    .docmetrics-footer a{color:#111;font-weight:600;}
    .total-row td{font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;color:#111;border-bottom:none;padding-top:14px;}
    @media print{body{-webkit-print-color-adjust:exact;}page{padding:48px 40px;}}
  </style>
`;

// ── Preview generators ────────────────────────────────────────────────────────

function buildWebsiteDesignHTML(f: WebsiteDesignFields): string {
  const deliverablesList = f.deliverables
    .filter(d => d.text.trim())
    .map(d => `<li>${d.text}</li>`)
    .join("");

  const pricingRows = f.pricingRows
    .filter(r => r.label.trim())
    .map((r, i) => `<tr>
      <td>${r.label}${i === 1 ? " <em style='font-size:11px;color:#999;'>(Most popular)</em>" : ""}</td>
      <td class="right">${r.amount || "—"}</td>
    </tr>`)
    .join("");

  const timelineRows = f.timelineRows
    .filter(r => r.period.trim())
    .map(r => `<tr><td style="font-weight:600;width:90px;">${r.period}</td><td>${r.task}</td></tr>`)
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${DOC_STYLE}</head><body>
<div class="page">
  <div class="cover">
    <h1>Website Design Proposal</h1>
    <p class="sub">Prepared exclusively for your project</p>
    <div class="meta-grid">
      <div class="meta-item"><label>Prepared by</label><span>${f.preparedBy || "—"}</span></div>
      <div class="meta-item"><label>Prepared for</label><span>${f.preparedFor || "—"}</span></div>
      <div class="meta-item"><label>Date</label><span>${f.date || "—"}</span></div>
      <div class="meta-item"><label>Valid until</label><span>${f.validUntil || "—"}</span></div>
    </div>
  </div>

  <h2>Understanding Your Project</h2>
  <p>${f.projectUnderstanding || "Based on our conversation I understand that you are looking to build a website that represents your business professionally and helps you attract the right clients."}</p>
  ${f.projectGoal ? `<p>The goal of this project is to <strong>${f.projectGoal}</strong>.</p>` : ""}

  <h2>What I Will Deliver</h2>
  <ul>${deliverablesList}</ul>

  <h2>Investment</h2>
  <p>I offer three options depending on your needs. Most clients choose the middle option.</p>
  <table>
    <thead><tr><th>Package</th><th style="text-align:right;">Investment</th></tr></thead>
    <tbody>${pricingRows}</tbody>
  </table>
  <p style="font-size:12px;color:#999;">A 50% deposit is required to begin. The remaining 50% is due before the final site is handed over.</p>

  <h2>Timeline</h2>
  <table>
    <thead><tr><th>Period</th><th>Work</th></tr></thead>
    <tbody>${timelineRows}</tbody>
  </table>

  <h2>Next Steps</h2>
  <div class="highlight-box">
    <p>${f.nextSteps}</p>
    ${f.yourEmail ? `<p style="margin-top:10px;font-size:13px;color:#666;">Questions before signing? Reach me at <strong>${f.yourEmail}</strong>.</p>` : ""}
  </div>

  <div class="sig-block">
    <div><div class="sig-line"></div><p class="sig-label">Client signature</p><p class="sig-name">${f.preparedFor || ""}</p><p class="sig-name" style="color:#bbb;">Date: _______________</p></div>
    <div><div class="sig-line"></div><p class="sig-label">Date signed</p></div>
  </div>

  <div class="docmetrics-footer">
    Want to know when your client opens this proposal and which sections held their attention? Upload it to DocMetrics for free. <a href="https://docmetrics.io/signup">docmetrics.io →</a>
  </div>
</div>
</body></html>`;
}

function buildCopywritingRetainerHTML(f: CopywritingRetainerFields): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${DOC_STYLE}</head><body>
<div class="page">
  <div class="cover">
    <h1>Copywriting Retainer Agreement</h1>
    <p class="sub">A service agreement between writer and client</p>
    <div class="meta-grid">
      <div class="meta-item"><label>Copywriter</label><span>${f.yourName || "—"}</span></div>
      <div class="meta-item"><label>Client</label><span>${f.clientName || "—"}</span></div>
      <div class="meta-item"><label>Start date</label><span>${f.startDate || "—"}</span></div>
      <div class="meta-item"><label>Initial term</label><span>${f.term || "—"}</span></div>
    </div>
  </div>

  <h2>1. Scope of Work</h2>
  <p>Each month the Copywriter will deliver the following to the Client:</p>
  <div class="highlight-box"><p>${f.scopeDescription || "Describe exactly what is delivered each month — number of blog posts, word counts, email newsletters, landing pages, etc."}</p></div>
  <p>Any content beyond this scope will be quoted separately before work begins.</p>

  <h2>2. Investment and Payment</h2>
  <div class="clause"><strong>Monthly retainer fee</strong><p>${f.monthlyFee ? `<strong>${f.monthlyFee}</strong> per month` : "—"}</p></div>
  <div class="clause"><strong>Invoice date</strong><p>Invoices are issued on the 1st of each month.</p></div>
  <div class="clause"><strong>Payment due</strong><p>Payment is due within <strong>${f.paymentDueDays}</strong> days of invoice date.</p></div>
  <div class="clause"><strong>Late payment</strong><p>Invoices unpaid after the due date incur a late fee of <strong>${f.lateFeeRate}</strong>.</p></div>

  <h2>3. Revisions</h2>
  <p>Each deliverable includes <strong>${f.revisionsCount}</strong> rounds of revisions. A revision round is one consolidated set of feedback submitted within 5 business days of delivery.</p>

  <h2>4. Client Responsibilities</h2>
  <div class="highlight-box"><p>${f.clientResponsibilities || "Describe what the client must provide — briefs, brand guidelines, approval timelines, etc."}</p></div>

  <h2>5. Ownership and Rights</h2>
  <p>Upon receipt of full payment the Client receives full ownership of all content delivered. The Copywriter retains the right to reference the work in their portfolio unless the Client requests otherwise in writing. Before full payment all content remains the property of the Copywriter.</p>

  <h2>6. Confidentiality</h2>
  <p>The Copywriter agrees to keep all Client information strictly confidential and will not share or use it for any purpose other than delivering the agreed services. This obligation continues after the agreement ends.</p>

  <h2>7. Termination</h2>
  <p>Either party may end this agreement with <strong>${f.noticeDays}</strong> days written notice. Work in progress at the time of notice will be completed and invoiced at the pro-rated monthly rate.</p>

  <h2>8. Independent Contractor</h2>
  <p>The Copywriter operates as an independent contractor. Nothing in this agreement creates an employment or partnership relationship. The Copywriter is responsible for their own taxes.</p>

  <div class="sig-block">
    <div><div class="sig-line"></div><p class="sig-label">Copywriter</p><p class="sig-name">${f.yourName || ""}</p><p class="sig-name" style="color:#bbb;">Date: _______________</p></div>
    <div><div class="sig-line"></div><p class="sig-label">Client</p><p class="sig-name">${f.clientName || ""}</p><p class="sig-name" style="color:#bbb;">Date: _______________</p></div>
  </div>

  <div class="docmetrics-footer">
    Before sending this contract upload it to DocMetrics to see exactly when your client opens it and how long they spend on each clause. <a href="https://docmetrics.io/signup">docmetrics.io →</a>
  </div>
</div>
</body></html>`;
}

function buildDigitalMarketingHTML(f: DigitalMarketingFields): string {
  const outcomes = [f.outcome1, f.outcome2, f.outcome3]
    .filter(Boolean)
    .map(o => `<li>${o}</li>`)
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${DOC_STYLE}</head><body>
<div class="page">
  <div class="cover">
    <h1>Digital Marketing Proposal</h1>
    <p class="sub">A growth strategy prepared exclusively for your business</p>
    <div class="meta-grid">
      <div class="meta-item"><label>Prepared by</label><span>${f.agencyName || "—"}</span></div>
      <div class="meta-item"><label>Prepared for</label><span>${f.clientName || "—"}</span></div>
      <div class="meta-item"><label>Date</label><span>${f.date || "—"}</span></div>
      <div class="meta-item"><label>Valid until</label><span>${f.validUntil || "—"}</span></div>
    </div>
  </div>

  <h2>Executive Summary</h2>
  <div class="highlight-box"><p>${f.executiveSummary || "Write one paragraph that captures the entire proposal. The client should be able to read only this and understand what you are proposing, why, and what it will cost."}</p></div>

  <h2>The Problem We Are Solving</h2>
  <p>${f.problemDescription || "Describe the client's problem in their own words from your discovery conversation."}</p>
  ${f.costOfInaction ? `<p>Left unaddressed this means: ${f.costOfInaction}</p>` : ""}

  <h2>Our Recommended Approach</h2>
  <table>
    <thead><tr><th>Phase</th><th>Activities</th></tr></thead>
    <tbody>
      <tr><td style="font-weight:600;width:120px;">Phase 1<br/><span style="font-weight:400;font-size:12px;color:#999;">Month 1–2</span></td><td>${f.phase1}</td></tr>
      <tr><td style="font-weight:600;">Phase 2<br/><span style="font-weight:400;font-size:12px;color:#999;">Month 3–4</span></td><td>${f.phase2}</td></tr>
      <tr><td style="font-weight:600;">Phase 3<br/><span style="font-weight:400;font-size:12px;color:#999;">Month 5–6</span></td><td>${f.phase3}</td></tr>
    </tbody>
  </table>

  ${outcomes ? `<h2>What Success Looks Like</h2><ul>${outcomes}</ul>` : ""}

  <h2>Investment</h2>
  <div class="clause"><strong>Monthly retainer</strong><p>${f.monthlyFee ? `<strong>${f.monthlyFee}</strong> per month` : "—"} &nbsp;·&nbsp; Minimum ${f.minimumTerm}</p></div>
  <p style="font-size:12px;color:#999;">Billed monthly on the 1st. Payment due within 14 days. A signed agreement and first month payment are required to begin.</p>

  ${f.caseStudyClient ? `<h2>A Relevant Result</h2>
  <div class="clause">
    <strong>${f.caseStudyClient}</strong>
    <p>${f.caseStudyChallenge}</p>
    ${f.caseStudyResult ? `<p style="font-weight:600;margin-top:6px;">Result: ${f.caseStudyResult}</p>` : ""}
  </div>` : ""}

  <h2>Next Steps</h2>
  <div class="highlight-box">
    <p>To move forward sign and return this proposal. We send an onboarding questionnaire and first invoice. Work begins within 3 business days of payment receipt.</p>
    ${f.yourEmail ? `<p style="margin-top:8px;font-size:13px;color:#666;">Questions? <strong>${f.yourEmail}</strong></p>` : ""}
  </div>

  <div class="sig-block">
    <div><div class="sig-line"></div><p class="sig-label">Agency representative</p><p class="sig-name">${f.agencyName || ""}</p><p class="sig-name" style="color:#bbb;">Date: _______________</p></div>
    <div><div class="sig-line"></div><p class="sig-label">Client authorised signatory</p><p class="sig-name">${f.clientName || ""}</p><p class="sig-name" style="color:#bbb;">Date: _______________</p></div>
  </div>

  <div class="docmetrics-footer">
    Agency proposals often get shared internally before a decision is made. DocMetrics tells you when that happens and who read which sections. <a href="https://docmetrics.io/signup">docmetrics.io →</a>
  </div>
</div>
</body></html>`;
}

function buildConsultingHTML(f: ConsultingFields): string {
  const credentials = [f.credential1, f.credential2, f.credential3]
    .filter(Boolean)
    .map(c => `<li>${c}</li>`)
    .join("");

  const fees = [
    { label: "Phase 1 — Discovery", amount: f.fee1 },
    { label: "Phase 2 — Design", amount: f.fee2 },
    { label: "Phase 3 — Delivery", amount: f.fee3 },
    { label: "Phase 4 — Handover", amount: f.fee4 },
  ]
    .filter(r => r.amount)
    .map(r => `<tr><td>${r.label}</td><td class="right">${r.amount}</td></tr>`)
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${DOC_STYLE}</head><body>
<div class="page">
  <div class="cover">
    <h1>Consulting Proposal</h1>
    <p class="sub">A recommended engagement prepared for your review</p>
    <div class="meta-grid">
      <div class="meta-item"><label>Consultant</label><span>${f.yourName || "—"}</span></div>
      <div class="meta-item"><label>Client</label><span>${f.clientName || "—"}</span></div>
      <div class="meta-item"><label>Date</label><span>${f.date || "—"}</span></div>
      <div class="meta-item"><label>Reference</label><span>${f.proposalRef || "—"}</span></div>
    </div>
  </div>

  ${credentials ? `<h2>About Me</h2>
  <p>I specialise in <strong>${f.expertise || "—"}</strong>, working with ${f.clientType || "businesses"} to ${f.outcome || "achieve measurable results"}.</p>
  <ul>${credentials}</ul>` : ""}

  <h2>My Diagnosis</h2>
  <p>Based on our discovery conversation I believe the core challenge is:</p>
  <div class="highlight-box"><p>${f.problemDiagnosis || "Describe the root cause, not just the symptoms."}</p></div>
  ${f.costOfInaction ? `<p>If this is not addressed: ${f.costOfInaction}</p>` : ""}

  <h2>Recommended Engagement</h2>
  <table>
    <thead><tr><th>Phase</th><th>Activities</th><th>Deliverables</th><th>Duration</th></tr></thead>
    <tbody>
      <tr><td style="font-weight:600;">1. Discovery</td><td>${f.phase1Activities}</td><td>${f.phase1Deliverables}</td><td>${f.phase1Duration}</td></tr>
      <tr><td style="font-weight:600;">2. Design</td><td>${f.phase2Activities}</td><td>${f.phase2Deliverables}</td><td>${f.phase2Duration}</td></tr>
      <tr><td style="font-weight:600;">3. Delivery</td><td>${f.phase3Activities}</td><td>${f.phase3Deliverables}</td><td>${f.phase3Duration}</td></tr>
      <tr><td style="font-weight:600;">4. Handover</td><td>${f.phase4Activities}</td><td>${f.phase4Deliverables}</td><td>${f.phase4Duration}</td></tr>
    </tbody>
  </table>

  <h2>Investment</h2>
  <table>
    <thead><tr><th>Phase</th><th style="text-align:right;">Fee</th></tr></thead>
    <tbody>
      ${fees}
      ${f.totalFee ? `<tr class="total-row"><td>Total engagement fee</td><td class="right">${f.totalFee}</td></tr>` : ""}
    </tbody>
  </table>
  <p style="font-size:12px;color:#999;">Payment: 30% on signing, 40% at Phase 2 completion, 30% on final handover.</p>

  ${f.roiArgument ? `<h2>Why This Investment Makes Sense</h2>
  <div class="highlight-box"><p>${f.roiArgument}</p>${f.roiPercentage ? `<p style="margin-top:8px;">The cost of this engagement is approximately <strong>${f.roiPercentage}%</strong> of the annual cost of leaving the problem unaddressed.</p>` : ""}</div>` : ""}

  <h2>Next Steps</h2>
  <div class="highlight-box">
    <p>Sign and return this proposal. I will send an engagement letter and first invoice within 24 hours.</p>
    ${f.yourEmail ? `<p style="margin-top:8px;font-size:13px;color:#666;">Questions? <strong>${f.yourEmail}</strong>${f.yourPhone ? ` · ${f.yourPhone}` : ""}${f.yourAvailability ? ` · ${f.yourAvailability}` : ""}</p>` : ""}
  </div>

  <div class="sig-block">
    <div><div class="sig-line"></div><p class="sig-label">Consultant</p><p class="sig-name">${f.yourName || ""}</p><p class="sig-name" style="color:#bbb;">Date: _______________</p></div>
    <div><div class="sig-line"></div><p class="sig-label">Client</p><p class="sig-name">${f.clientName || ""}</p><p class="sig-name" style="color:#bbb;">Date: _______________</p></div>
  </div>

  <div class="docmetrics-footer">
    Consulting proposals often sit with multiple stakeholders for days. DocMetrics tracks every time your proposal is opened, re-read, or shared internally. <a href="https://docmetrics.io/signup">docmetrics.io →</a>
  </div>
</div>
</body></html>`;
}

// ── Input components ──────────────────────────────────────────────────────────

function Field({
  label, value, onChange, multiline = false, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  const base: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: 13,
    border: "1px solid #e5e7eb", borderRadius: 6,
    fontFamily: "inherit", color: "#111", background: "#fff",
    outline: "none", lineHeight: 1.5,
    resize: multiline ? "vertical" : undefined,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
        {label}
      </label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #f1f5f9" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Form panels ───────────────────────────────────────────────────────────────

function WebsiteDesignForm({ fields, setFields }: { fields: WebsiteDesignFields; setFields: (f: WebsiteDesignFields) => void }) {
  const set = (k: keyof WebsiteDesignFields) => (v: string) => setFields({ ...fields, [k]: v });

  const updateDeliverable = (id: string, text: string) => {
    setFields({ ...fields, deliverables: fields.deliverables.map(d => d.id === id ? { ...d, text } : d) });
  };
  const addDeliverable = () => {
    setFields({ ...fields, deliverables: [...fields.deliverables, { id: Date.now().toString(), text: "" }] });
  };
  const removeDeliverable = (id: string) => {
    setFields({ ...fields, deliverables: fields.deliverables.filter(d => d.id !== id) });
  };

  const updatePricing = (i: number, key: "label" | "amount", v: string) => {
    const rows = [...fields.pricingRows];
    rows[i] = { ...rows[i], [key]: v };
    setFields({ ...fields, pricingRows: rows });
  };

  const updateTimeline = (i: number, key: "period" | "task", v: string) => {
    const rows = [...fields.timelineRows];
    rows[i] = { ...rows[i], [key]: v };
    setFields({ ...fields, timelineRows: rows });
  };

  return (
    <div>
      <Section title="Header">
        <Field label="Your name / studio" value={fields.preparedBy} onChange={set("preparedBy")} />
        <Field label="Client name" value={fields.preparedFor} onChange={set("preparedFor")} />
        <Field label="Date" value={fields.date} onChange={set("date")} />
        <Field label="Valid until" value={fields.validUntil} onChange={set("validUntil")} placeholder="e.g. June 30, 2026" />
      </Section>
      <Section title="Project Understanding">
        <Field label="What the client wants" value={fields.projectUnderstanding} onChange={set("projectUnderstanding")} multiline placeholder="Based on our conversation I understand you are looking to..." />
        <Field label="Project goal" value={fields.projectGoal} onChange={set("projectGoal")} placeholder="attract more clients through an updated online presence" />
      </Section>
      <Section title="Deliverables">
        {fields.deliverables.map((d) => (
          <div key={d.id} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={d.text} onChange={e => updateDeliverable(d.id, e.target.value)} style={{ flex: 1, padding: "7px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }} />
            <button onClick={() => removeDeliverable(d.id)} style={{ padding: "0 10px", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", color: "#9ca3af" }}>×</button>
          </div>
        ))}
        <button onClick={addDeliverable} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "1px dashed #d1d5db", borderRadius: 6, padding: "6px 12px", cursor: "pointer", marginTop: 4 }}>+ Add deliverable</button>
      </Section>
      <Section title="Pricing Packages">
        {fields.pricingRows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 6, marginBottom: 6 }}>
            <input value={row.label} onChange={e => updatePricing(i, "label", e.target.value)} placeholder={`Package ${i + 1} description`} style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }} />
            <input value={row.amount} onChange={e => updatePricing(i, "amount", e.target.value)} placeholder="$2,500" style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }} />
          </div>
        ))}
      </Section>
      <Section title="Timeline">
        {fields.timelineRows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 6, marginBottom: 6 }}>
            <input value={row.period} onChange={e => updateTimeline(i, "period", e.target.value)} placeholder="Week 1" style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }} />
            <input value={row.task} onChange={e => updateTimeline(i, "task", e.target.value)} placeholder="What happens this week" style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }} />
          </div>
        ))}
      </Section>
      <Section title="Next Steps & Contact">
        <Field label="Next steps message" value={fields.nextSteps} onChange={set("nextSteps")} multiline />
        <Field label="Your email" value={fields.yourEmail} onChange={set("yourEmail")} placeholder="you@yourstudio.com" />
      </Section>
    </div>
  );
}

function CopywritingRetainerForm({ fields, setFields }: { fields: CopywritingRetainerFields; setFields: (f: CopywritingRetainerFields) => void }) {
  const set = (k: keyof CopywritingRetainerFields) => (v: string) => setFields({ ...fields, [k]: v });
  return (
    <div>
      <Section title="Parties">
        <Field label="Your full name" value={fields.yourName} onChange={set("yourName")} />
        <Field label="Client name / company" value={fields.clientName} onChange={set("clientName")} />
        <Field label="Agreement start date" value={fields.startDate} onChange={set("startDate")} placeholder="June 1, 2026" />
        <Field label="Initial term" value={fields.term} onChange={set("term")} placeholder="3 months" />
      </Section>
      <Section title="Scope of Work">
        <Field label="Monthly deliverables" value={fields.scopeDescription} onChange={set("scopeDescription")} multiline placeholder="4 blog posts of approximately 1000 words each, 2 email newsletters of approximately 400 words, 1 landing page per month" />
      </Section>
      <Section title="Payment">
        <Field label="Monthly fee" value={fields.monthlyFee} onChange={set("monthlyFee")} placeholder="$2,000 / month" />
        <Field label="Payment due (days)" value={fields.paymentDueDays} onChange={set("paymentDueDays")} placeholder="14" />
        <Field label="Late fee rate" value={fields.lateFeeRate} onChange={set("lateFeeRate")} placeholder="1.5% per month" />
      </Section>
      <Section title="Revisions & Responsibilities">
        <Field label="Revision rounds included" value={fields.revisionsCount} onChange={set("revisionsCount")} placeholder="two" />
        <Field label="Client responsibilities" value={fields.clientResponsibilities} onChange={set("clientResponsibilities")} multiline placeholder="Monthly content brief submitted by the 20th, brand guidelines provided, approval within 5 business days" />
      </Section>
      <Section title="Termination & Contact">
        <Field label="Notice period (days)" value={fields.noticeDays} onChange={set("noticeDays")} placeholder="30" />
        <Field label="Your email" value={fields.yourEmail} onChange={set("yourEmail")} />
        <Field label="Your phone" value={fields.yourPhone} onChange={set("yourPhone")} />
      </Section>
    </div>
  );
}

function DigitalMarketingForm({ fields, setFields }: { fields: DigitalMarketingFields; setFields: (f: DigitalMarketingFields) => void }) {
  const set = (k: keyof DigitalMarketingFields) => (v: string) => setFields({ ...fields, [k]: v });
  return (
    <div>
      <Section title="Header">
        <Field label="Agency name" value={fields.agencyName} onChange={set("agencyName")} />
        <Field label="Client company" value={fields.clientName} onChange={set("clientName")} />
        <Field label="Date" value={fields.date} onChange={set("date")} />
        <Field label="Valid until" value={fields.validUntil} onChange={set("validUntil")} />
      </Section>
      <Section title="Executive Summary">
        <Field label="One paragraph summary" value={fields.executiveSummary} onChange={set("executiveSummary")} multiline placeholder="We are proposing a 6-month SEO and content strategy to help [Client] reach page 1 for their three highest-value search terms..." />
      </Section>
      <Section title="The Problem">
        <Field label="Problem description" value={fields.problemDescription} onChange={set("problemDescription")} multiline placeholder="Use their own words from your discovery call" />
        <Field label="Cost of inaction" value={fields.costOfInaction} onChange={set("costOfInaction")} multiline placeholder="Continued market share loss to competitors, increasing cost per lead..." />
      </Section>
      <Section title="Approach — 3 Phases">
        <Field label="Phase 1 (Month 1–2)" value={fields.phase1} onChange={set("phase1")} multiline />
        <Field label="Phase 2 (Month 3–4)" value={fields.phase2} onChange={set("phase2")} multiline />
        <Field label="Phase 3 (Month 5–6)" value={fields.phase3} onChange={set("phase3")} multiline />
      </Section>
      <Section title="Expected Outcomes">
        <Field label="Outcome 1" value={fields.outcome1} onChange={set("outcome1")} placeholder="Organic traffic increased 40-60% within 6 months" />
        <Field label="Outcome 2" value={fields.outcome2} onChange={set("outcome2")} placeholder="Cost per lead reduced by 25%" />
        <Field label="Outcome 3" value={fields.outcome3} onChange={set("outcome3")} placeholder="Ranking in top 3 for primary search terms" />
      </Section>
      <Section title="Investment">
        <Field label="Monthly fee" value={fields.monthlyFee} onChange={set("monthlyFee")} placeholder="$3,500 / month" />
        <Field label="Minimum term" value={fields.minimumTerm} onChange={set("minimumTerm")} placeholder="3 months" />
      </Section>
      <Section title="Case Study">
        <Field label="Client / industry" value={fields.caseStudyClient} onChange={set("caseStudyClient")} placeholder="E-commerce client, fashion" />
        <Field label="Challenge" value={fields.caseStudyChallenge} onChange={set("caseStudyChallenge")} multiline />
        <Field label="Result" value={fields.caseStudyResult} onChange={set("caseStudyResult")} placeholder="312% increase in organic traffic over 5 months" />
      </Section>
      <Section title="Contact">
        <Field label="Your email" value={fields.yourEmail} onChange={set("yourEmail")} />
      </Section>
    </div>
  );
}

function ConsultingForm({ fields, setFields }: { fields: ConsultingFields; setFields: (f: ConsultingFields) => void }) {
  const set = (k: keyof ConsultingFields) => (v: string) => setFields({ ...fields, [k]: v });
  return (
    <div>
      <Section title="Header">
        <Field label="Your full name" value={fields.yourName} onChange={set("yourName")} />
        <Field label="Client name / company" value={fields.clientName} onChange={set("clientName")} />
        <Field label="Date" value={fields.date} onChange={set("date")} />
        <Field label="Proposal reference" value={fields.proposalRef} onChange={set("proposalRef")} placeholder="PROP-001" />
      </Section>
      <Section title="Your Credentials">
        <Field label="Your area of expertise" value={fields.expertise} onChange={set("expertise")} placeholder="operational strategy and process design" />
        <Field label="Type of clients you work with" value={fields.clientType} onChange={set("clientType")} placeholder="mid-size B2B companies" />
        <Field label="The outcome you deliver" value={fields.outcome} onChange={set("outcome")} placeholder="reduce operational costs and improve team efficiency" />
        <Field label="Credential 1" value={fields.credential1} onChange={set("credential1")} multiline placeholder="Specific past result relevant to this client's problem" />
        <Field label="Credential 2" value={fields.credential2} onChange={set("credential2")} multiline />
        <Field label="Credential 3" value={fields.credential3} onChange={set("credential3")} multiline />
      </Section>
      <Section title="Diagnosis">
        <Field label="Root cause of their problem" value={fields.problemDiagnosis} onChange={set("problemDiagnosis")} multiline placeholder="The real issue beneath the surface, not just the symptoms" />
        <Field label="Cost of inaction" value={fields.costOfInaction} onChange={set("costOfInaction")} multiline placeholder="Describe the business cost in concrete terms" />
      </Section>
      <Section title="Engagement Phases">
        {(["1","2","3","4"] as const).map((n) => {
          const acts = `phase${n}Activities` as keyof ConsultingFields;
          const dels = `phase${n}Deliverables` as keyof ConsultingFields;
          const dur = `phase${n}Duration` as keyof ConsultingFields;
          const labels = ["Discovery","Design","Delivery","Handover"];
          return (
            <div key={n} style={{ marginBottom: 16, padding: "12px 14px", background: "#f9fafb", borderRadius: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Phase {n} — {labels[+n-1]}</p>
              <Field label="Activities" value={fields[acts] as string} onChange={set(acts)} multiline />
              <Field label="Deliverables" value={fields[dels] as string} onChange={set(dels)} />
              <Field label="Duration" value={fields[dur] as string} onChange={set(dur)} placeholder="2 weeks" />
            </div>
          );
        })}
      </Section>
      <Section title="Fees">
        <Field label="Phase 1 fee" value={fields.fee1} onChange={set("fee1")} placeholder="$5,000" />
        <Field label="Phase 2 fee" value={fields.fee2} onChange={set("fee2")} placeholder="$5,000" />
        <Field label="Phase 3 fee" value={fields.fee3} onChange={set("fee3")} placeholder="$15,000" />
        <Field label="Phase 4 fee" value={fields.fee4} onChange={set("fee4")} placeholder="$3,000" />
        <Field label="Total fee" value={fields.totalFee} onChange={set("totalFee")} placeholder="$28,000" />
      </Section>
      <Section title="ROI Justification">
        <Field label="Why the fee is worth it" value={fields.roiArgument} onChange={set("roiArgument")} multiline placeholder="Make the commercial case. What is the annual cost of the problem without intervention?" />
        <Field label="Fee as % of problem cost" value={fields.roiPercentage} onChange={set("roiPercentage")} placeholder="12" />
      </Section>
      <Section title="Terms & Contact">
        <Field label="Notice period (days)" value={fields.noticeDays} onChange={set("noticeDays")} placeholder="14" />
        <Field label="Day rate" value={fields.dayRate} onChange={set("dayRate")} placeholder="$2,500 / day" />
        <Field label="Estimated expenses" value={fields.estimatedExpenses} onChange={set("estimatedExpenses")} placeholder="$1,500" />
        <Field label="Your email" value={fields.yourEmail} onChange={set("yourEmail")} />
        <Field label="Your phone" value={fields.yourPhone} onChange={set("yourPhone")} />
        <Field label="Your availability" value={fields.yourAvailability} onChange={set("yourAvailability")} placeholder="Mon–Fri 9am–5pm GMT+1" />
      </Section>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TemplateEditor() {
  const searchParams = useSearchParams();

  const getInitialTemplate = (): TemplateId => {
    const param = searchParams.get("template");
    if (param === "copywriting-retainer") return "copywriting-retainer";
    if (param === "digital-marketing") return "digital-marketing";
    if (param === "consulting") return "consulting";
    return "website-design";
  };

  const [selected, setSelected] = useState<TemplateId>(getInitialTemplate);
  const [websiteFields, setWebsiteFields] = useState(defaultWebsite);
  const [copywritingFields, setCopywritingFields] = useState(defaultCopywriting);
  const [marketingFields, setMarketingFields] = useState(defaultDigitalMarketing);
  const [consultingFields, setConsultingFields] = useState(defaultConsulting);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const getHTML = useCallback((): string => {
    if (selected === "website-design") return buildWebsiteDesignHTML(websiteFields);
    if (selected === "copywriting-retainer") return buildCopywritingRetainerHTML(copywritingFields);
    if (selected === "digital-marketing") return buildDigitalMarketingHTML(marketingFields);
    return buildConsultingHTML(consultingFields);
  }, [selected, websiteFields, copywritingFields, marketingFields, consultingFields]);

 const handlePrint = () => {
    const html = getHTML();
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  const handleDownload = () => {
    const html = getHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentTemplate.title.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentTemplate = TEMPLATES.find(t => t.id === selected)!;

  const previewHTML = getHTML();

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: "-.2px" }}>DocMetrics</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>/ Proposal Builder</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
         <button
            onClick={handleDownload}
            style={{ padding: "8px 18px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginRight: 8 }}
          >
            ↓ Save as HTML
          </button>
          <button
            onClick={handlePrint}
            style={{ padding: "8px 18px", background: "#fff", color: "#111", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            🖨 Print / Save PDF
          </button>
        </div>
      </div>

      {/* Template selector */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                padding: "14px 18px", background: "none", border: "none",
                borderBottom: selected === t.id ? "2px solid #111" : "2px solid transparent",
                fontSize: 13, fontWeight: selected === t.id ? 600 : 400,
                color: selected === t.id ? "#111" : "#6b7280",
                cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s",
              }}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout — form + preview */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "calc(100vh - 105px)" }}>

        {/* Form panel */}
        <div style={{ borderRight: "1px solid #e5e7eb", overflowY: "auto", background: "#fff" }}>
          <div style={{ padding: "20px 20px 8px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>{currentTemplate.title}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 0 }}>{currentTemplate.desc}</p>
          </div>
          <div style={{ padding: "16px 20px 40px" }}>
            {selected === "website-design" && <WebsiteDesignForm fields={websiteFields} setFields={setWebsiteFields} />}
            {selected === "copywriting-retainer" && <CopywritingRetainerForm fields={copywritingFields} setFields={setCopywritingFields} />}
            {selected === "digital-marketing" && <DigitalMarketingForm fields={marketingFields} setFields={setMarketingFields} />}
            {selected === "consulting" && <ConsultingForm fields={consultingFields} setFields={setConsultingFields} />}
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ overflowY: "auto", background: "#e9eaec", padding: "24px" }}>
          <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 2px 12px rgba(0,0,0,.1)", overflow: "hidden", minHeight: 900 }}>
            <iframe
              ref={previewRef}
              srcDoc={previewHTML}
              style={{ width: "100%", height: "100%", minHeight: 900, border: "none", display: "block" }}
              title="Document preview"
            />
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 12 }}>
            Live preview · Click Download PDF to save
          </p>
        </div>
      </div>
    </div>
  );
}