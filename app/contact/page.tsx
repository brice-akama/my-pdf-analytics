// app/contact/page.tsx
 import type { Metadata } from "next"
 import { JSX } from "react"
import ContactClient from "./ContactClient"
  

 // ── FAQ data must be duplicated here so JSON-LD renders server-side ──
 const FAQS = [
   { question: "How quickly will you respond to my message?", answer: "We respond to all support enquiries within one business day. For billing and account issues we aim to respond within a few hours during business hours." },
   { question: "I found a bug — how do I report it?", answer: "Use the contact form and select Bug Report as the subject. Describe what you were doing when the bug occurred, what you expected to happen, and what actually happened. Screenshots are very helpful." },
   { question: "I have a feature request — where do I send it?", answer: "Use the contact form and select Feature Request. We read every request and use them to prioritise our roadmap. The more detail you provide about your use case the more helpful it is." },
   { question: "I need help with my account or billing — who do I contact?", answer: "Email billing@docmetrics.io directly or use the contact form and select Billing as the subject. Include your account email so we can look up your account quickly." },
   { question: "I am a journalist or researcher — who should I contact?", answer: "Email hello@docmetrics.io with details about your publication and what you are working on. We are happy to speak with journalists and researchers covering document analytics or SaaS." },
 ]

 export const metadata: Metadata = {
   title: "Contact DocMetrics — Get Help, Report a Bug, or Share Feedback",
   description:
     "Reach the DocMetrics team for support, billing, bug reports, feature requests, or partnership enquiries. We respond to all messages within one business day.",
   alternates: {
     canonical: "https://docmetrics.io/contact",
   },
   openGraph: {
     title: "Contact DocMetrics — Get Help, Report a Bug, or Share Feedback",
     description:
       "Reach the DocMetrics team for support, billing, bug reports, feature requests, or partnership enquiries. We respond within one business day.",
     url: "https://docmetrics.io/contact",
     siteName: "DocMetrics",
     type: "website",
     locale: "en_US",
     images: [
       {
         url: "/og-image.png",
         width: 1200,
         height: 630,
         alt: "Contact DocMetrics Support Team",
       },
     ],
   },
 }

 const faqSchema = {
   "@context": "https://schema.org",
   "@type": "FAQPage",
   mainEntity: FAQS.map((faq) => ({
     "@type": "Question",
     name: faq.question,
     acceptedAnswer: {
       "@type": "Answer",
       text: faq.answer,
     },
   })),
 }

 const contactPageSchema = {
   "@context": "https://schema.org",
   "@type": "ContactPage",
   name: "Contact DocMetrics",
   url: "https://docmetrics.io/contact",
   description:
     "Contact the DocMetrics team for support, billing, bug reports, feature requests, security reports, and partnership enquiries.",
   contactPoint: [
    { "@type": "ContactPoint", email: "support@docmetrics.io",  contactType: "customer support",  availableLanguage: "English" },
    { "@type": "ContactPoint", email: "billing@docmetrics.io",  contactType: "billing support",   availableLanguage: "English" },
     { "@type": "ContactPoint", email: "security@docmetrics.io", contactType: "technical support", availableLanguage: "English" },
   ],
 }

 export default function ContactPage(): JSX.Element {
   return (
     <>
       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
      <ContactClient />
    </>
  )
 }