"use client";

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft,
  FileText,
  TrendingUp,
  Users,
  Shield,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Clock,
  Lock,
  Share2,
  Eye,
  Download,
  Mail,
  Calendar,
  Award,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileSignature,
  Inbox,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function BestPracticesPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState("getting-started")

  const categories = [
    { id: "getting-started", label: "Getting Started", icon: Sparkles },
    { id: "document-sharing", label: "Document Sharing", icon: Share2 },
    { id: "analytics", label: "Analytics & Tracking", icon: BarChart3 },
    { id: "security", label: "Security", icon: Shield },
    { id: "collaboration", label: "Collaboration", icon: Users },
    { id: "optimization", label: "Optimization", icon: TrendingUp }
  ]

  const practicesByCategory = {
    "getting-started": [
      {
        icon: Sparkles,
        title: "Set Up Your Profile Completely",
        description: "Complete your profile with company information, logo, and branding to build trust with recipients.",
        do: [
          "Add your company name and logo",
          "Fill in contact information",
          "Customize your email notifications",
          "Set up your default sharing preferences"
        ],
        dont: [
          "Leave your profile incomplete",
          "Use a personal email for business documents",
          "Skip the onboarding tutorial"
        ],
        impact: "high",
        difficulty: "easy"
      },
      {
        icon: FileText,
        title: "Organize Documents with Clear Naming",
        description: "Use descriptive, consistent naming conventions to make documents easy to find and manage.",
        do: [
          "Use clear, descriptive names (e.g., 'Q4_2024_Sales_Proposal_Acme')",
          "Include dates in YYYY-MM-DD format",
          "Use underscores or hyphens, not spaces",
          "Create folders for different clients or projects"
        ],
        dont: [
          "Use generic names like 'Document1' or 'Final_FINAL'",
          "Include special characters that cause issues",
          "Create overly long file names (keep under 50 characters)"
        ],
        impact: "medium",
        difficulty: "easy"
      },
      {
        icon: Target,
        title: "Define Your Goals Before Sharing",
        description: "Know what you want to achieve with each document share to measure success effectively.",
        do: [
          "Set clear objectives (e.g., get signature, receive feedback)",
          "Identify your target audience",
          "Plan your follow-up strategy",
          "Set deadlines for responses"
        ],
        dont: [
          "Share documents without a clear purpose",
          "Send to everyone without targeting",
          "Forget to track outcomes"
        ],
        impact: "high",
        difficulty: "easy"
      }
    ],
    "document-sharing": [
      {
        icon: Share2,
        title: "Choose the Right Sharing Method",
        description: "Select between link sharing and email-based sharing based on your security needs and audience.",
        do: [
          "Use public links for broad audiences (marketing materials)",
          "Use email-based sharing for specific recipients (contracts)",
          "Set expiration dates for time-sensitive documents",
          "Enable email verification for added security"
        ],
        dont: [
          "Share sensitive documents via public links",
          "Forget to set expiration dates on confidential content",
          "Share the same link across multiple channels without tracking"
        ],
        impact: "high",
        difficulty: "medium"
      },
      {
        icon: Lock,
        title: "Set Appropriate Permissions",
        description: "Control who can view, download, edit, and share your documents to maintain security.",
        do: [
          "Restrict downloads for confidential documents",
          "Enable watermarks for legal documents",
          "Use password protection for sensitive content",
          "Set view-only permissions when editing isn't needed"
        ],
        dont: [
          "Give everyone full permissions by default",
          "Allow downloads of proprietary information",
          "Forget to revoke access when no longer needed"
        ],
        impact: "high",
        difficulty: "easy"
      },
      {
        icon: Mail,
        title: "Craft Compelling Share Messages",
        description: "Include context and clear calls-to-action when sharing documents to improve engagement.",
        do: [
          "Personalize the message with recipient's name",
          "Explain why you're sharing and what action you need",
          "Set clear deadlines",
          "Include your contact information for questions"
        ],
        dont: [
          "Send generic messages without context",
          "Use all caps or excessive exclamation marks",
          "Write overly long messages (keep to 2-3 sentences)"
        ],
        impact: "medium",
        difficulty: "easy"
      },
      {
        icon: Clock,
        title: "Time Your Document Shares Strategically",
        description: "Send documents at optimal times for maximum engagement and response rates.",
        do: [
          "Send on Tuesday-Thursday between 10am-2pm (best engagement)",
          "Avoid Monday mornings and Friday afternoons",
          "Consider recipient's timezone",
          "Follow up 2-3 days after initial share if no response"
        ],
        dont: [
          "Send late at night or on weekends",
          "Share multiple important documents at once",
          "Forget to schedule reminders for yourself"
        ],
        impact: "medium",
        difficulty: "easy"
      }
    ],
    "analytics": [
      {
        icon: BarChart3,
        title: "Track the Right Metrics",
        description: "Focus on metrics that align with your business goals and provide actionable insights.",
        do: [
          "Monitor view rates (% of recipients who opened)",
          "Track time spent per page",
          "Analyze engagement patterns (which pages get most attention)",
          "Measure conversion rates (views to signatures/responses)"
        ],
        dont: [
          "Focus only on vanity metrics like total views",
          "Ignore page-by-page analytics",
          "Compare metrics without context"
        ],
        impact: "high",
        difficulty: "medium"
      },
      {
        icon: Eye,
        title: "Understand Viewer Behavior",
        description: "Use engagement data to understand what resonates with your audience and optimize accordingly.",
        do: [
          "Note which pages viewers spend most time on",
          "Identify drop-off points in long documents",
          "Track re-visits (indicates strong interest)",
          "Monitor geographic locations for targeting insights"
        ],
        dont: [
          "Make decisions based on a single data point",
          "Ignore patterns across multiple shares",
          "Forget to segment data by recipient type"
        ],
        impact: "high",
        difficulty: "medium"
      },
      {
        icon: TrendingUp,
        title: "Act on Analytics Insights",
        description: "Use data to improve your documents, timing, and follow-up strategies.",
        do: [
          "Follow up quickly after document views",
          "Shorten documents if you see high drop-off rates",
          "Test different document formats and measure results",
          "Create templates based on high-performing documents"
        ],
        dont: [
          "Collect data without taking action",
          "Make changes based on insufficient data",
          "Ignore negative trends"
        ],
        impact: "high",
        difficulty: "medium"
      },
      {
        icon: Target,
        title: "Set Benchmarks and Goals",
        description: "Establish baseline metrics and track improvement over time.",
        do: [
          "Calculate your average view rate",
          "Set realistic improvement targets (e.g., +10% engagement)",
          "Compare performance across document types",
          "Review metrics weekly or monthly"
        ],
        dont: [
          "Compare your metrics to unrelated industries",
          "Set unrealistic goals without baseline data",
          "Change too many variables at once when testing"
        ],
        impact: "medium",
        difficulty: "medium"
      }
    ],
    "security": [
      {
        icon: Shield,
        title: "Implement Multi-Layer Security",
        description: "Use multiple security features to protect sensitive documents from unauthorized access.",
        do: [
          "Enable two-factor authentication on your account",
          "Use password protection for confidential documents",
          "Set expiration dates on shared links",
          "Require email verification before viewing"
        ],
        dont: [
          "Reuse passwords across platforms",
          "Share login credentials with team members",
          "Leave old share links active indefinitely"
        ],
        impact: "high",
        difficulty: "easy"
      },
      {
        icon: Lock,
        title: "Control Document Access Carefully",
        description: "Regularly review and update who has access to your documents.",
        do: [
          "Revoke access immediately when someone leaves your organization",
          "Audit document permissions quarterly",
          "Use view-only mode by default for external shares",
          "Log and monitor access for compliance"
        ],
        dont: [
          "Grant 'edit' permissions unless absolutely necessary",
          "Forget to remove access for external consultants after projects end",
          "Share admin access broadly"
        ],
        impact: "high",
        difficulty: "medium"
      },
      {
        icon: AlertTriangle,
        title: "Handle Sensitive Data Properly",
        description: "Take extra precautions when sharing documents containing personal or confidential information.",
        do: [
          "Redact sensitive information before sharing",
          "Use NDAs before sharing proprietary information",
          "Enable download restrictions for confidential files",
          "Add visible watermarks with recipient information"
        ],
        dont: [
          "Include SSNs, credit card numbers, or passwords in documents",
          "Share financial data without encryption",
          "Upload HIPAA or PCI-compliant data without proper safeguards"
        ],
        impact: "high",
        difficulty: "medium"
      },
      {
        icon: FileSignature,
        title: "Use Secure Signature Workflows",
        description: "Ensure contracts and agreements are signed securely and legally binding.",
        do: [
          "Verify signer identities via email confirmation",
          "Use built-in eSignature features for compliance",
          "Keep audit trails of all signature activity",
          "Store signed documents in encrypted format"
        ],
        dont: [
          "Accept unsigned PDFs for legal agreements",
          "Skip identity verification for important contracts",
          "Delete signature audit logs"
        ],
        impact: "high",
        difficulty: "easy"
      }
    ],
    "collaboration": [
      {
        icon: Users,
        title: "Coordinate Team Document Sharing",
        description: "Establish clear processes for how your team creates, shares, and manages documents.",
        do: [
          "Create shared folders for team documents",
          "Use consistent naming conventions across the team",
          "Assign document ownership and responsibilities",
          "Set up approval workflows for external shares"
        ],
        dont: [
          "Let everyone share documents without oversight",
          "Create duplicate documents in multiple locations",
          "Skip version control"
        ],
        impact: "medium",
        difficulty: "medium"
      },
      {
        icon: MessageSquare,
        title: "Enable Effective Document Feedback",
        description: "Make it easy for recipients to provide feedback and ask questions about your documents.",
        do: [
          "Include clear instructions for providing feedback",
          "Enable comments on documents when appropriate",
          "Respond promptly to questions and comments",
          "Create a feedback summary after receiving input"
        ],
        dont: [
          "Ignore feedback requests",
          "Make it difficult for recipients to reach you",
          "Forget to close the feedback loop"
        ],
        impact: "medium",
        difficulty: "easy"
      },
      {
        icon: Inbox,
        title: "Streamline File Request Processes",
        description: "Create organized systems for collecting documents from clients and partners.",
        do: [
          "Provide clear instructions on what files you need",
          "Set deadlines for file submissions",
          "Send automated reminders",
          "Organize received files in labeled folders"
        ],
        dont: [
          "Request files via email attachments (use file requests instead)",
          "Accept files in incompatible formats",
          "Forget to confirm receipt of files"
        ],
        impact: "medium",
        difficulty: "easy"
      },
      {
        icon: Calendar,
        title: "Manage Data Room Projects",
        description: "Use data rooms effectively for complex deals, fundraising, or audits.",
        do: [
          "Organize documents in logical folder structures",
          "Set different permissions for different user groups",
          "Track who accessed what and when",
          "Prepare all documents before inviting participants"
        ],
        dont: [
          "Upload disorganized or mislabeled files",
          "Give everyone access to everything",
          "Update documents after deal negotiations start"
        ],
        impact: "high",
        difficulty: "hard"
      }
    ],
    "optimization": [
      {
        icon: TrendingUp,
        title: "Optimize Document Structure",
        description: "Structure your documents for maximum engagement and comprehension.",
        do: [
          "Put key information in the first 3 pages",
          "Use clear headings and page breaks",
          "Keep total page count under 20 when possible",
          "Use executive summaries for long documents"
        ],
        dont: [
          "Bury important information deep in the document",
          "Create documents over 50 pages without navigation",
          "Use tiny fonts or cramped layouts"
        ],
        impact: "high",
        difficulty: "medium"
      },
      {
        icon: Zap,
        title: "Improve Document Load Times",
        description: "Optimize file sizes and formats for faster loading and better user experience.",
        do: [
          "Compress PDFs before uploading (target < 10MB)",
          "Optimize images within documents",
          "Remove unnecessary embedded fonts",
          "Test document loading on slower connections"
        ],
        dont: [
          "Upload unnecessarily large files (>50MB)",
          "Include ultra-high-resolution images",
          "Embed large videos in PDFs"
        ],
        impact: "medium",
        difficulty: "medium"
      },
      {
        icon: Award,
        title: "Create Reusable Templates",
        description: "Build templates for common document types to save time and maintain consistency.",
        do: [
          "Create templates for proposals, contracts, and reports",
          "Include placeholders for customization",
          "Version control your templates",
          "Share templates across your team"
        ],
        dont: [
          "Recreate the same document from scratch each time",
          "Forget to update templates with latest branding",
          "Use outdated pricing or terms in templates"
        ],
        impact: "medium",
        difficulty: "easy"
      },
      {
        icon: Lightbulb,
        title: "A/B Test Your Documents",
        description: "Experiment with different versions to find what works best for your audience.",
        do: [
          "Test different document lengths",
          "Try various cover page designs",
          "Experiment with pricing presentation",
          "Measure which version performs better"
        ],
        dont: [
          "Test too many variables at once",
          "Make conclusions with insufficient sample size",
          "Forget to document your findings"
        ],
        impact: "medium",
        difficulty: "hard"
      }
    ]
  }

  const renderPracticeCard = (practice: any, index: number) => (
    <div key={index} className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
          practice.impact === 'high' ? 'from-purple-500 to-purple-600' :
          practice.impact === 'medium' ? 'from-blue-500 to-blue-600' :
          'from-green-500 to-green-600'
        } flex items-center justify-center flex-shrink-0`}>
          <practice.icon className="h-6 w-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-900">{practice.title}</h3>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                practice.impact === 'high' ? 'bg-purple-100 text-purple-700' :
                practice.impact === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {practice.impact === 'high' ? 'High Impact' : 
                 practice.impact === 'medium' ? 'Medium Impact' : 'Low Impact'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                practice.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                practice.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {practice.difficulty === 'easy' ? 'Easy' : 
                 practice.difficulty === 'medium' ? 'Medium' : 'Advanced'}
              </span>
            </div>
          </div>
          <p className="text-slate-600 mb-4">{practice.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Do's */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-900">DO</h4>
          </div>
          <ul className="space-y-2">
            {practice.do.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Don'ts */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-900">DON'T</h4>
          </div>
          <ul className="space-y-2">
            {practice.dont.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Link href="/">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DocMetrics
              </span>
            </Link>

            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Best Practices Guide
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Master{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              DocMetrics
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Learn proven strategies to get more out of your document analytics, 
            improve engagement, and close deals faster.
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 mb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: "Best Practices", value: "30+", color: "from-blue-500 to-blue-600" },
            { icon: TrendingUp, label: "Avg. Improvement", value: "+40%", color: "from-green-500 to-green-600" },
            { icon: Users, label: "Success Stories", value: "1000+", color: "from-purple-500 to-purple-600" },
            { icon: Award, label: "Expert Tips", value: "50+", color: "from-orange-500 to-orange-600" }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm p-4 text-center">
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-8 bg-white p-1 rounded-xl">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                >
                  <cat.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(practicesByCategory).map(([categoryId, practices]) => (
              <TabsContent key={categoryId} value={categoryId} className="space-y-6">
                {practices.map((practice, index) => renderPracticeCard(practice, index))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to put these into practice?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Start applying these best practices today and see measurable improvements 
              in your document engagement and conversion rates.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                  Go to Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Talk to an Expert
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}