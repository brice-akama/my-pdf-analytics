"use client";
import React, { JSX, useState } from "react";
import { Building2, Shield, Users, Zap, HeadphonesIcon, Globe, Lock, Award, CheckCircle2, TrendingUp, BarChart3, Clock, FileText, Settings, Database, Workflow, PhoneCall, Mail, Calendar, ArrowRight, Star, Target, Briefcase, LineChart, Cloud, Server, Key, UserCheck, GitBranch, Package, Cpu, HardDrive } from "lucide-react";

export default function EnterprisePage(): JSX.Element {
  const [selectedPlan, setSelectedPlan] = useState<"team" | "enterprise">("enterprise");

  const trustedCompanies = [
    { name: "Fortune 500", logo: "🏢", industry: "Technology" },
    { name: "Global Bank", logo: "🏦", industry: "Finance" },
    { name: "Healthcare Corp", logo: "🏥", industry: "Healthcare" },
    { name: "Retail Giant", logo: "🛒", industry: "Retail" },
    { name: "Consulting Firm", logo: "💼", industry: "Consulting" },
    { name: "Manufacturing Co", logo: "🏭", industry: "Manufacturing" }
  ];

  const enterpriseFeatures = [
    {
      category: "Security & Compliance",
      icon: Shield,
      color: "blue",
      features: [
        { name: "SSO/SAML Authentication", included: true },
        { name: "SOC 2 Type II Certified", included: true },
        { name: "GDPR & CCPA Compliant", included: true },
        { name: "Custom Data Retention Policies", included: true },
        { name: "Advanced Audit Logs", included: true },
        { name: "HIPAA Compliance Available", included: true },
        { name: "On-Premise Deployment Option", included: true },
        { name: "Dedicated Security Team", included: true }
      ]
    },
    {
      category: "Scale & Performance",
      icon: Zap,
      color: "orange",
      features: [
        { name: "Unlimited Documents", included: true },
        { name: "Unlimited Team Members", included: true },
        { name: "Custom API Rate Limits", included: true },
        { name: "99.99% Uptime SLA", included: true },
        { name: "Dedicated Infrastructure", included: true },
        { name: "Global CDN", included: true },
        { name: "Priority Processing", included: true },
        { name: "Load Balancing", included: true }
      ]
    },
    {
      category: "Advanced Features",
      icon: Settings,
      color: "purple",
      features: [
        { name: "Custom Integrations", included: true },
        { name: "White-Label Solution", included: true },
        { name: "Advanced Analytics & BI", included: true },
        { name: "Custom Workflow Automation", included: true },
        { name: "Multi-Workspace Management", included: true },
        { name: "Advanced Permissions & Roles", included: true },
        { name: "Custom Branding", included: true },
        { name: "API Access & Webhooks", included: true }
      ]
    },
    {
      category: "Support & Success",
      icon: HeadphonesIcon,
      color: "green",
      features: [
        { name: "24/7 Priority Support", included: true },
        { name: "Dedicated Account Manager", included: true },
        { name: "Technical Success Manager", included: true },
        { name: "Custom Onboarding Program", included: true },
        { name: "Quarterly Business Reviews", included: true },
        { name: "Training & Certification", included: true },
        { name: "99% First Response SLA", included: true },
        { name: "Direct Engineering Access", included: true }
      ]
    }
  ];

  const comparisonData = [
    { feature: "Users", team: "Up to 50", enterprise: "Unlimited" },
    { feature: "Documents", team: "10,000/month", enterprise: "Unlimited" },
    { feature: "API Calls", team: "10,000/hour", enterprise: "Custom" },
    { feature: "Storage", team: "1TB", enterprise: "Unlimited" },
    { feature: "Support", team: "Email (24hr)", enterprise: "24/7 Priority" },
    { feature: "SSO", team: "❌", enterprise: "✓" },
    { feature: "Custom Integration", team: "❌", enterprise: "✓" },
    { feature: "SLA", team: "99.5%", enterprise: "99.99%" },
    { feature: "Dedicated Manager", team: "❌", enterprise: "✓" },
    { feature: "Custom Contract", team: "❌", enterprise: "✓" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="h-4 w-4" />
            Enterprise Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Built for Enterprise Scale
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Secure, scalable document analytics for organizations that need enterprise-grade 
            features, compliance, and dedicated support. Trusted by Fortune 500 companies worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg">
              Schedule Demo
            </button>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors border-2 border-blue-600">
              Contact Sales
            </button>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="mb-20">
          <p className="text-center text-slate-600 mb-8 font-medium">
            Trusted by leading organizations across industries
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {trustedCompanies.map((company, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all text-center"
              >
                <div className="text-4xl mb-2">{company.logo}</div>
                <div className="font-semibold text-slate-900 text-sm mb-1">{company.name}</div>
                <div className="text-xs text-slate-500">{company.industry}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold text-center mb-12">
              Enterprise Impact at Scale
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">500+</div>
                <div className="text-blue-100">Enterprise Customers</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">99.99%</div>
                <div className="text-blue-100">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">50M+</div>
                <div className="text-blue-100">Documents Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Priority Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Enterprise Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Why Choose DocMetri Enterprise?
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-3xl mx-auto">
            Go beyond standard features with enterprise-grade security, dedicated support, 
            and custom solutions tailored to your organization's needs.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border-2 border-blue-200">
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise Security</h3>
              <p className="text-slate-700 mb-4">
                SOC 2 Type II certified with SSO, advanced encryption, and compliance with 
                GDPR, CCPA, and HIPAA standards.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Single Sign-On (SSO/SAML)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Advanced audit logging</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Custom data retention</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>On-premise deployment</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200">
              <Zap className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Unlimited Scale</h3>
              <p className="text-slate-700 mb-4">
                Built to handle millions of documents and thousands of users with 
                guaranteed 99.99% uptime and lightning-fast performance.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Unlimited documents & users</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Dedicated infrastructure</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Custom API rate limits</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Global CDN delivery</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border-2 border-green-200">
              <HeadphonesIcon className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">White-Glove Support</h3>
              <p className="text-slate-700 mb-4">
                Dedicated account team including success manager, technical expert, 
                and 24/7 priority support with direct engineering access.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Technical success manager</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>24/7 priority support</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Quarterly business reviews</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enterprise Features Grid */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Comprehensive Enterprise Features
          </h2>

          <div className="space-y-8">
            {enterpriseFeatures.map((category, idx) => (
              <div key={idx} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
                <div className={`bg-${category.color}-50 border-b border-slate-200 p-6`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl bg-${category.color}-100 flex items-center justify-center`}>
                      <category.icon className={`h-6 w-6 text-${category.color}-600`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{category.category}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {category.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{feature.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Team vs Enterprise Comparison
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            See how Enterprise features compare to our Team plan. Need something custom? 
            We can build a solution tailored to your needs.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-900">Feature</th>
                  <th className="text-center p-4">
                    <div className="inline-block">
                      <div className="font-bold text-slate-900 mb-1">Team</div>
                      <div className="text-sm text-slate-600">$99/month</div>
                    </div>
                  </th>
                  <th className="text-center p-4">
                    <div className="inline-block">
                      <div className="font-bold text-blue-600 mb-1">Enterprise</div>
                      <div className="text-sm text-slate-600">Custom Pricing</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                    <td className="p-4 font-medium text-slate-900">{row.feature}</td>
                    <td className="p-4 text-center text-slate-700">{row.team}</td>
                    <td className="p-4 text-center text-blue-600 font-semibold">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Enterprise Use Cases
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border-2 border-blue-200">
              <Briefcase className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Global Sales Organizations</h3>
              <p className="text-slate-700 mb-4">
                Track proposal engagement across hundreds of sales reps worldwide. Integrate with 
                Salesforce, HubSpot, or your custom CRM for seamless workflow automation.
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm font-semibold text-slate-900 mb-2">Key Benefits:</div>
                <ul className="space-y-1 text-xs text-slate-700">
                  <li>• Multi-region compliance (GDPR, CCPA, PIPEDA)</li>
                  <li>• Centralized analytics dashboard</li>
                  <li>• Role-based access control by region</li>
                  <li>• Custom reporting for leadership</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200">
              <FileText className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Legal & Financial Services</h3>
              <p className="text-slate-700 mb-4">
                Secure document sharing with advanced audit trails, SOC 2 compliance, and 
                granular permissions for sensitive contracts and financial documents.
              </p>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-sm font-semibold text-slate-900 mb-2">Key Benefits:</div>
                <ul className="space-y-1 text-xs text-slate-700">
                  <li>• Complete audit trail logging</li>
                  <li>• Document expiration controls</li>
                  <li>• Watermarking and DRM options</li>
                  <li>• Compliance reporting dashboards</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border-2 border-green-200">
              <Building2 className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Healthcare Organizations</h3>
              <p className="text-slate-700 mb-4">
                HIPAA-compliant document tracking for patient information, research data, and 
                internal communications with end-to-end encryption.
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-sm font-semibold text-slate-900 mb-2">Key Benefits:</div>
                <ul className="space-y-1 text-xs text-slate-700">
                  <li>• HIPAA compliance certification</li>
                  <li>• BAA (Business Associate Agreement)</li>
                  <li>• PHI data encryption at rest and in transit</li>
                  <li>• Access logging and monitoring</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 border-2 border-orange-200">
              <Target className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Marketing & PR Agencies</h3>
              <p className="text-slate-700 mb-4">
                White-label solution for agencies managing multiple client accounts with separate 
                workspaces, billing, and custom branding.
              </p>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="text-sm font-semibold text-slate-900 mb-2">Key Benefits:</div>
                <ul className="space-y-1 text-xs text-slate-700">
                  <li>• Multi-tenant architecture</li>
                  <li>• Custom branding per client</li>
                  <li>• Consolidated billing and reporting</li>
                  <li>• Agency-level analytics dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Process */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Enterprise Onboarding Process
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Our structured onboarding ensures a smooth transition with minimal disruption 
            to your operations. From planning to go-live in 4-6 weeks.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Discovery & Planning",
                duration: "Week 1",
                icon: Calendar,
                color: "blue",
                items: ["Requirements gathering", "Technical assessment", "Success criteria definition", "Implementation roadmap"]
              },
              {
                step: "2",
                title: "Configuration & Integration",
                duration: "Week 2-3",
                icon: Settings,
                color: "purple",
                items: ["SSO setup", "API integration", "Custom workflows", "Data migration"]
              },
              {
                step: "3",
                title: "Training & Testing",
                duration: "Week 4-5",
                icon: Users,
                color: "green",
                items: ["Admin training", "User workshops", "UAT testing", "Documentation review"]
              },
              {
                step: "4",
                title: "Launch & Support",
                duration: "Week 6+",
                icon: Zap,
                color: "orange",
                items: ["Production launch", "Monitoring & optimization", "Ongoing support", "Quarterly reviews"]
              }
            ].map((phase, idx) => (
              <div key={idx} className="relative">
                <div className={`bg-gradient-to-br from-${phase.color}-50 to-${phase.color}-100 rounded-xl p-6 border-2 border-${phase.color}-200 h-full`}>
                  <div className={`h-12 w-12 rounded-full bg-${phase.color}-600 text-white flex items-center justify-center text-xl font-bold mb-4`}>
                    {phase.step}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{phase.title}</h3>
                  <div className={`text-xs font-semibold text-${phase.color}-600 mb-4`}>{phase.duration}</div>
                  <ul className="space-y-2">
                    {phase.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className={`h-3 w-3 text-${phase.color}-600 mt-0.5 flex-shrink-0`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {idx < 3 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 h-6 w-6 text-slate-300 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            What Enterprise Customers Say
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "DocMetri Enterprise transformed how we track proposal engagement across 50+ sales reps. The SSO integration was seamless, and our close rates improved by 35% in the first quarter.",
                author: "Michael Chen",
                role: "VP of Sales",
                company: "TechCorp International",
                rating: 5
              },
              {
                quote: "As a healthcare organization, HIPAA compliance was non-negotiable. DocMetri's dedicated security team and BAA made implementation straightforward. The audit logs are comprehensive.",
                author: "Dr. Sarah Williams",
                role: "Chief Information Officer",
                company: "HealthCare Systems",
                rating: 5
              },
              {
                quote: "The white-label solution lets us offer document analytics to our 200+ clients under our brand. The dedicated account manager has been invaluable for custom feature requests.",
                author: "James Rodriguez",
                role: "Managing Director",
                company: "Global Marketing Agency",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-xl border-2 border-slate-200 p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Enterprise-Grade Security & Compliance
          </h2>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Shield, label: "SOC 2 Type II", color: "blue" },
              { icon: Lock, label: "GDPR Compliant", color: "green" },
              { icon: Award, label: "ISO 27001", color: "purple" },
              { icon: FileText, label: "HIPAA Ready", color: "orange" }
            ].map((cert, idx) => (
              <div key={idx} className={`bg-${cert.color}-50 rounded-xl p-6 border-2 border-${cert.color}-200 text-center`}>
                <cert.icon className={`h-10 w-10 text-${cert.color}-600 mx-auto mb-3`} />
                <div className="font-bold text-slate-900">{cert.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
            <h3 className="font-bold text-slate-900 mb-6 text-center">Comprehensive Security Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Data Protection
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>AES-256 encryption at rest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>TLS 1.3 in transit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>End-to-end encryption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Key management service</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  Access Control
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>SSO/SAML 2.0</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Multi-factor authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Role-based permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Session management</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Compliance & Audit
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Complete audit trails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Data retention policies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Regular security audits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Penetration testing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Enterprise Infrastructure
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-6">
                <Server className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Dedicated Infrastructure</h3>
              </div>
              <p className="text-slate-700 mb-6">
                Choose between our cloud infrastructure or deploy on-premise for maximum control 
                and compliance with data sovereignty requirements.
              </p>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-blue-600" />
                    Cloud Deployment
                  </div>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>• Multi-region availability</li>
                    <li>• Auto-scaling capabilities</li>
                    <li>• 99.99% uptime SLA</li>
                    <li>• Managed infrastructure</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                    On-Premise Option
                  </div>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>• Full data control</li>
                    <li>• Custom infrastructure</li>
                    <li>• Air-gapped deployment</li>
                    <li>• Compliance flexibility</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-bold text-slate-900">Performance & Reliability</h3>
              </div>
              <p className="text-slate-700 mb-6">
                Built on enterprise-grade infrastructure with redundancy, monitoring, and 
                guaranteed uptime to ensure your business never stops.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">99.99%</div>
                  <div className="text-xs text-slate-600">Uptime SLA</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">&lt;100ms</div>
                  <div className="text-xs text-slate-600">API Response</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">24/7</div>
                  <div className="text-xs text-slate-600">Monitoring</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">Auto</div>
                  <div className="text-xs text-slate-600">Failover</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Enterprise FAQs
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "What's included in Enterprise pricing?",
                a: "Enterprise pricing is customized based on your needs and includes unlimited users, documents, API calls, dedicated support, SSO, custom integrations, and SLA guarantees. Contact sales for a personalized quote."
              },
              {
                q: "How long does implementation take?",
                a: "Most enterprise implementations are completed within 4-6 weeks from contract signing to production launch. Complex integrations or custom requirements may extend this timeline."
              },
              {
                q: "Can we deploy DocMetri on-premise?",
                a: "Yes! We offer on-premise deployment for enterprises with specific data sovereignty or security requirements. This includes full installation support and ongoing maintenance."
              },
              {
                q: "What compliance certifications do you have?",
                a: "We are SOC 2 Type II certified, GDPR and CCPA compliant, ISO 27001 certified, and offer HIPAA compliance with a Business Associate Agreement (BAA) for healthcare organizations."
              },
              {
                q: "Do you offer custom integrations?",
                a: "Absolutely! Our engineering team can build custom integrations with your CRM, ERP, data warehouse, or any internal systems. We also provide API access and webhooks for DIY integrations."
              },
              {
                q: "What does the SLA cover?",
                a: "Our Enterprise SLA guarantees 99.99% uptime, first response times under 1 hour for critical issues, and dedicated support channels. Financial credits are provided if we don't meet our commitments."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border-2 border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <Building2 className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Scale with Enterprise?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of enterprise organizations that trust DocMetri for their document 
              analytics needs. Let's discuss how we can support your specific requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                aria-label="Schedule enterprise demo"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Demo
                </div>
              </button>
              <button 
                className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors border-2 border-white"
                aria-label="Contact sales team"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Contact Sales
                </div>
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-100">
                <Mail className="h-4 w-4" />
                enterprise@docmetri.com
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-100">
                <PhoneCall className="h-4 w-4" />
                +1 (800) DOCMETRI
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-100">
                <Calendar className="h-4 w-4" />
                Response within 24 hours
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t text-center text-sm text-slate-600">
          <p>© 2025 DocMetri. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Security</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}