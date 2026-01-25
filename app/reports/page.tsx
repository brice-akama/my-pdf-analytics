"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Eye,
  MousePointerClick,
  Clock,
  Share2,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Smartphone,
  Globe,
  Trophy,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSignature,
  Mail,
  Bell,
  Shield,
  Zap,
  Target,
  TrendingDown,
  Pause,
  Play,
  SkipForward,
  ChevronRight,
  ChevronDown,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Star,
  Award,
  Flame
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

type ViewType = 'overview' | 'all-documents' | 'document-detail' | 'leaderboard' | 'documents-report' | 'recipients-report' | 'status-report'
type AnalyticsView = 'basic' | 'advanced'

type DeadDealSignal = {
  signal: string;
  severity: 'low' | 'medium' | 'high';
};


// Enhanced Mock Data
const mockDocuments = [
  {
    id: '1',
    name: 'Q4_Sales_Proposal.pdf',
    deadDealScore: 85,
    deadDealVerdict: 'DEAD',
    deadDealConfidence: 92,
    deadDealSignals: [
      {
        type: 'CRITICAL',
        signal: 'Declined with "Budget constraints"',
        weight: 40,
        explanation: 'Budget objections rarely reverse without major changes'
      },
      {
        type: 'CRITICAL',
        signal: 'No re-engagement after decline',
        weight: 30,
        explanation: '14 days since decline with zero follow-up'
      },
      {
        type: 'HIGH',
        signal: 'Declined on pricing page after 5+ min review',
        weight: 25,
        explanation: 'Thorough review before decline = informed rejection'
      }
    ],
    deadDealRecommendations: [
      {
        action: 'Archive this deal',
        priority: 'HIGH',
        reason: 'Multiple critical signals with 92% confidence'
      },
      {
        action: 'If pursuing: Send CEO-level executive brief with new pricing',
        priority: 'MEDIUM',
        reason: 'Only high-level intervention can revive at this stage'
      }
    ],
    recoveryProbability: 8,
    status: 'active',
    sent: 12,
    pending: 3,
    completed: 8,
    declined: 1,
    completionRate: '67%',
    avgTime: '2.3 days',
    lastSent: '2026-01-20',
    owner: 'John Doe',
    ownerEmail: 'john@company.com',
    totalViews: 45,
    uniqueViewers: 12,
    avgTimeSpent: '8m 32s',
    signatureRate: '67%',
    avgTimeToSign: '1.2 days'
  },
  {
    id: '2',
    name: 'NDA_Template_2026.pdf',
    status: 'active',
    sent: 45,
    pending: 5,
    completed: 38,
     deadDealScore: 35, // Low score = healthy
    deadDealVerdict: 'HEALTHY',
    deadDealConfidence: 75,
    deadDealSignals: [],
    deadDealRecommendations: [],
    recoveryProbability: 85,
    declined: 2,
    
    completionRate: '84%',
    avgTime: '1.5 days',
    lastSent: '2026-01-22',
    owner: 'John Doe',
    ownerEmail: 'john@company.com',
    totalViews: 156,
    uniqueViewers: 45,
    avgTimeSpent: '5m 18s',
    signatureRate: '84%',
    avgTimeToSign: '0.8 days'
  },
  {
    id: '3',
    name: 'Product_Roadmap_2026.pdf',
    status: 'active',
    sent: 8,
    pending: 2,
    completed: 6,
    declined: 0,
    completionRate: '75%',
    avgTime: '3.1 days',
    lastSent: '2026-01-18',
    owner: 'John Doe',
    ownerEmail: 'john@company.com',
    totalViews: 34,
    uniqueViewers: 8,
    avgTimeSpent: '12m 45s',
    signatureRate: '75%',
    avgTimeToSign: '2.1 days',
    declineReasons: [
      { reason: 'Budget constraints', count: 1, recipientName: 'Emma Williams' }
    ],
    declinePatterns: {
      avgTimeBeforeDecline: '4m 32s',
      mostCommonDeclinePage: 3,
      declinePageName: 'Pricing Section'
    },
    deadDealScore: 25, // 0-100 scale (higher = more likely dead)
    deadDealSignals: [
      { signal: 'Low re-engagement after decline', severity: 'medium' }
    ],
    deadDealRecommendations: [
      { action: 'Follow up with revised pricing', priority: 'low' }
    ]
  }
]

// Link Analytics Data
const mockLinkAnalytics = [
  {
    recipient: 'sarah@acme.com',
    recipientName: 'Sarah Johnson',
    status: 'signed',
    opened: true,
    openCount: 5,
    lastViewed: '2026-01-24 15:30',
    firstOpened: '2026-01-20 09:15',
    device: 'Desktop',
    location: 'New York, US',
    ip: '192.168.1.1'
  },
  {
    recipient: 'michael@techcorp.com',
    recipientName: 'Michael Chen',
    status: 'pending',
    opened: true,
    openCount: 2,
    lastViewed: '2026-01-23 11:20',
    firstOpened: '2026-01-22 14:30',
    device: 'Mobile',
    location: 'San Francisco, US',
    ip: '192.168.1.2'
  },
  {
    recipient: 'emma@startup.io',
    recipientName: 'Emma Williams',
    status: 'declined',
    opened: true,
    openCount: 1,
    lastViewed: '2026-01-22 16:45',
    firstOpened: '2026-01-22 16:45',
    device: 'Desktop',
    location: 'London, UK',
    ip: '192.168.1.3'
  },
  {
    recipient: 'david@company.com',
    recipientName: 'David Brown',
    status: 'not-opened',
    opened: false,
    openCount: 0,
    lastViewed: null,
    firstOpened: null,
    device: null,
    location: null,
    ip: null
  }
]

 

// Add after mockRoleData
const mockDeclineReasons = [
  { reason: 'Terms not acceptable', count: 8, percentage: 35, trend: 'up' },
  { reason: 'Needs legal review', count: 6, percentage: 26, trend: 'stable' },
  { reason: 'Budget constraints', count: 4, percentage: 17, trend: 'down' },
  { reason: 'Timeline too aggressive', count: 3, percentage: 13, trend: 'stable' },
  { reason: 'Other', count: 2, percentage: 9, trend: 'stable' }
]

const mockDeclinePatterns = [
  { 
    pattern: 'Declined on first page',
    count: 12,
    insight: 'Recipients are rejecting before reading full terms',
    recommendation: 'Add executive summary on page 1 highlighting key benefits'
  },
  {
    pattern: 'Declined after 5+ minutes review',
    count: 8,
    insight: 'Recipients are reading thoroughly but finding deal-breakers',
    recommendation: 'Review pricing/terms sections - may need negotiation flexibility'
  },
  {
    pattern: 'Declined within 30 seconds',
    count: 5,
    insight: 'Instant rejection suggests misalignment or wrong audience',
    recommendation: 'Verify target audience and pre-qualify recipients before sending'
  }
]

// Enhanced page engagement with time tracking
const mockPageEngagement = [
  { page: 'Page 1', timeSpent: 145, views: 12, dropOffRate: 5, avgTimePerUser: '12s', completionRate: 95 },
  { page: 'Page 2', timeSpent: 98, views: 11, dropOffRate: 9, avgTimePerUser: '9s', completionRate: 91 },
  { page: 'Page 3', timeSpent: 76, views: 10, dropOffRate: 20, avgTimePerUser: '8s', completionRate: 80 },
  { page: 'Page 4', timeSpent: 54, views: 8, dropOffRate: 25, avgTimePerUser: '7s', completionRate: 75 },
  { page: 'Page 5', timeSpent: 32, views: 6, dropOffRate: 33, avgTimePerUser: '5s', completionRate: 67 }
]

// Status breakdown by time periods
const mockStatusTrends = [
  { period: 'Week 1', signed: 12, pending: 5, declined: 1, notOpened: 3 },
  { period: 'Week 2', signed: 15, pending: 4, declined: 2, notOpened: 2 },
  { period: 'Week 3', signed: 13, pending: 3, declined: 0, notOpened: 1 },
  { period: 'Week 4', signed: 12, pending: 8, declined: 0, notOpened: 2 }
]

// Signature Friction Data
const mockSignatureFriction = [
  { step: 'Document Opened', users: 12, avgTime: '0s', dropOff: 0 },
  { step: 'Scrolled to Signature', users: 11, avgTime: '2m 15s', dropOff: 8 },
  { step: 'Started Signing', users: 10, avgTime: '4m 30s', dropOff: 9 },
  { step: 'Completed Signing', users: 8, avgTime: '1m 45s', dropOff: 20 }
]

// Reminder Effectiveness Data
const mockReminderData = [
  { reminderType: 'No Reminder', signRate: 45, avgTime: '5.2 days' },
  { reminderType: '1 Reminder', signRate: 68, avgTime: '3.1 days' },
  { reminderType: '2 Reminders', signRate: 82, avgTime: '2.3 days' },
  { reminderType: '3+ Reminders', signRate: 91, avgTime: '1.8 days' }
]

// Intent/Interest Analytics
const mockIntentData = {
  highIntent: 4,
  mediumIntent: 5,
  lowIntent: 3,
  signals: [
    { signal: 'Multiple page views', count: 8 },
    { signal: 'Long time spent', count: 6 },
    { signal: 'Returned multiple times', count: 5 },
    { signal: 'Scrolled to end', count: 7 }
  ]
}

// Role-based Analytics
const mockRoleData = [
  { role: 'Decision Maker', sent: 15, signed: 12, signRate: 80, avgTime: '1.2 days' },
  { role: 'Influencer', sent: 20, signed: 14, signRate: 70, avgTime: '2.1 days' },
  { role: 'End User', sent: 10, signed: 6, signRate: 60, avgTime: '3.5 days' }
]

 // Dead Deal Detection Algorithm
const mockDeadDealLogic = {
  documentId: '1',
  documentName: 'Q4_Sales_Proposal.pdf',
  
  // DEAD DEAL SCORE: 0-100 (higher = more dead)
  deadDealScore: 85, // This deal is 85% dead
  
  // SIGNALS that indicate a dead deal
  signals: [
    {
      type: 'CRITICAL', // CRITICAL, HIGH, MEDIUM, LOW
      signal: 'Declined with "Budget constraints"',
      weight: 40,
      explanation: 'Budget objections rarely reverse without major changes'
    },
    {
      type: 'CRITICAL',
      signal: 'No re-engagement after decline',
      weight: 30,
      daysNoContact: 14,
      explanation: '14 days since decline with zero follow-up - deal is cold'
    },
    {
      type: 'HIGH',
      signal: 'Declined on pricing page after 5+ min review',
      weight: 25,
      explanation: 'Thorough review before decline = informed rejection, not confusion'
    },
    {
      type: 'MEDIUM',
      signal: 'Only 1 decision-maker opened',
      weight: 15,
      explanation: 'No internal champion - deal lacks momentum'
    },
    {
      type: 'HIGH',
      signal: 'Competitor mentioned in decline reason',
      weight: 35,
      explanation: 'Already evaluating alternatives - hard to win back'
    }
  ],
  
  // CALCULATION
  totalWeight: 145, // Sum of all signal weights
  normalizedScore: 85, // Capped at 100
  
  // VERDICT
  verdict: 'DEAD', // DEAD, DYING, AT_RISK, HEALTHY
  confidence: 92, // How confident we are (%)
  
  // RECOMMENDATIONS
  recommendations: [
    {
      action: 'Archive this deal',
      priority: 'HIGH',
      reason: 'Multiple critical signals with 92% confidence'
    },
    {
      action: 'If pursuing: Send CEO-level executive brief with new pricing',
      priority: 'MEDIUM',
      reason: 'Only high-level intervention can revive at this stage'
    },
    {
      action: 'Mark as "Lost to Competitor" in CRM',
      priority: 'HIGH',
      reason: 'Competitor mentioned - clean pipeline data'
    }
  ],
  
  // RECOVERY PROBABILITY
  recoveryProbability: 8, // 8% chance of revival
  estimatedEffortToRecover: 'Very High',
  recommendedAction: 'Let go and focus on warmer leads'
}

// Per-recipient page tracking for a specific document
const mockRecipientPageTracking = [
  {
    recipientId: '1',
    recipientName: 'Sarah Johnson',
    recipientEmail: 'sarah@acme.com',
    totalTimeOnDoc: '8m 45s',
    bounced: false, // opened and closed quickly
    pageData: [
      { page: 1, visited: true, timeSpent: 145, scrollDepth: 100, skipped: false, visits: 2 },
      { page: 2, visited: true, timeSpent: 98, scrollDepth: 100, skipped: false, visits: 1 },
      { page: 3, visited: true, timeSpent: 300, scrollDepth: 95, skipped: false, visits: 3 }, // 5 minutes on page 3
      { page: 4, visited: true, timeSpent: 76, scrollDepth: 60, skipped: false, visits: 1 },
      { page: 5, visited: true, timeSpent: 54, scrollDepth: 100, skipped: false, visits: 1 }
    ]
  },
  {
    recipientId: '2',
    recipientName: 'Michael Chen',
    recipientEmail: 'michael@techcorp.com',
    totalTimeOnDoc: '4m 12s',
    bounced: false,
    pageData: [
      { page: 1, visited: true, timeSpent: 89, scrollDepth: 100, skipped: false, visits: 1 },
      { page: 2, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 }, // SKIPPED
      { page: 3, visited: true, timeSpent: 143, scrollDepth: 75, skipped: false, visits: 2 },
      { page: 4, visited: true, timeSpent: 20, scrollDepth: 30, skipped: false, visits: 1 },
      { page: 5, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 } // SKIPPED
    ]
  },
  {
    recipientId: '3',
    recipientName: 'Emma Williams',
    recipientEmail: 'emma@startup.io',
    totalTimeOnDoc: '8s',
    bounced: true, // BOUNCED - opened and closed quickly
    pageData: [
      { page: 1, visited: true, timeSpent: 8, scrollDepth: 15, skipped: false, visits: 1 },
      { page: 2, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 },
      { page: 3, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 },
      { page: 4, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 },
      { page: 5, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 }
    ]
  },
  {
    recipientId: '4',
    recipientName: 'David Brown',
    recipientEmail: 'david@company.com',
    totalTimeOnDoc: '0s',
    bounced: true, // NEVER OPENED
    pageData: [
      { page: 1, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 },
      { page: 2, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 },
      { page: 3, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 },
      { page: 4, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 },
      { page: 5, visited: false, timeSpent: 0, scrollDepth: 0, skipped: true, visits: 0 }
    ]
  }
]

// Aggregate page analytics (what I provided before - still useful for overview)
const mockPageEngagementAggregate = [
  { page: 'Page 1', timeSpent: 242, views: 3, dropOffRate: 0, avgTimePerUser: '1m 21s', completionRate: 100, skipRate: 0 },
  { page: 'Page 2', timeSpent: 98, views: 2, dropOffRate: 25, avgTimePerUser: '49s', completionRate: 75, skipRate: 25 },
  { page: 'Page 3', timeSpent: 443, views: 3, dropOffRate: 0, avgTimePerUser: '2m 28s', completionRate: 75, skipRate: 0 },
  { page: 'Page 4', timeSpent: 96, views: 2, dropOffRate: 0, avgTimePerUser: '48s', completionRate: 75, skipRate: 25 },
  { page: 'Page 5', timeSpent: 54, views: 1, dropOffRate: 50, avgTimePerUser: '54s', completionRate: 50, skipRate: 50 }
]

// Bounce detection summary
const mockBounceAnalytics = {
  totalRecipients: 4,
  bounced: 2, // opened < 30 seconds
  engaged: 2, // spent meaningful time
  bounceRate: 50,
  avgEngagementTime: '6m 28s' // for non-bounced users
}

// Leaderboard Data
const mockLeaderboard = [
  {
    rank: 1,
    document: 'NDA_Template_2026.pdf',
    views: 156,
    signRate: 84,
    avgTime: '1.5 days',
    trend: 'up',
    score: 95
  },
  {
    rank: 2,
    document: 'Product_Roadmap_2026.pdf',
    views: 89,
    signRate: 75,
    avgTime: '3.1 days',
    trend: 'up',
    score: 82
  },
  {
    rank: 3,
    document: 'Q4_Sales_Proposal.pdf',
    views: 67,
    signRate: 67,
    avgTime: '2.3 days',
    trend: 'down',
    score: 74
  }
]

export default function ReportsPage() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [timeRange, setTimeRange] = useState('30')
  const [searchQuery, setSearchQuery] = useState('')
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>('basic')

  const filteredDocuments = mockDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDocumentClick = (doc: any) => {
    setSelectedDocument(doc)
    setCurrentView('document-detail')
  }

  const handleBackToList = () => {
    setCurrentView('all-documents')
    setSelectedDocument(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900">Reports & Analytics</h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>

            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white/80 backdrop-blur min-h-screen">
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setCurrentView('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'overview' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-purple-50'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Workspace Analytics</span>
            </button>

            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'leaderboard' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-purple-50'
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setCurrentView('all-documents')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'all-documents' || currentView === 'document-detail' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-purple-50'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>All Documents</span>
            </button>

            <div className="pt-4 border-t mt-4">
              <p className="text-xs font-semibold text-slate-500 px-3 mb-2">BY DOCUMENTS</p>
              
              <button
                onClick={() => setCurrentView('documents-report')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'documents-report' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-purple-50'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Documents Report</span>
              </button>

              <button
                onClick={() => setCurrentView('recipients-report')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'recipients-report' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-purple-50'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Recipients Report</span>
              </button>

              <button
                onClick={() => setCurrentView('status-report')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'status-report' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-purple-50'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Status Report</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* LEADERBOARD VIEW */}
          {currentView === 'leaderboard' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Document Leaderboard</h2>
                <p className="text-slate-600">Your top performing documents ranked by engagement and conversion</p>
              </div>

              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* 2nd Place */}
                <Card className="mt-8">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 text-slate-700 font-bold text-2xl mb-3">
                      2
                    </div>
                    <Award className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900 mb-1 text-sm">{mockLeaderboard[1].document}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Badge variant="secondary">{mockLeaderboard[1].views} views</Badge>
                      <Badge className="bg-green-100 text-green-700">{mockLeaderboard[1].signRate}%</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Score: {mockLeaderboard[1].score}</p>
                  </CardContent>
                </Card>

                {/* 1st Place */}
                <Card className="border-2 border-yellow-400 shadow-lg">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-white font-bold text-3xl mb-3 shadow-lg">
                      1
                    </div>
                    <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-900 mb-1">{mockLeaderboard[0].document}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Badge variant="secondary">{mockLeaderboard[0].views} views</Badge>
                      <Badge className="bg-green-100 text-green-700">{mockLeaderboard[0].signRate}%</Badge>
                    </div>
                    <p className="text-sm text-slate-600">Score: <span className="font-bold text-purple-600">{mockLeaderboard[0].score}</span></p>
                  </CardContent>
                </Card>

                {/* 3rd Place */}
                <Card className="mt-12">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-200 text-amber-800 font-bold text-xl mb-3">
                      3
                    </div>
                    <Award className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900 mb-1 text-sm">{mockLeaderboard[2].document}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">{mockLeaderboard[2].views} views</Badge>
                      <Badge className="bg-green-100 text-green-700 text-xs">{mockLeaderboard[2].signRate}%</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Score: {mockLeaderboard[2].score}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Full Leaderboard Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Documents Ranked</CardTitle>
                  <CardDescription>Sorted by overall performance score</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Sign Rate</TableHead>
                        <TableHead className="text-center">Avg Time</TableHead>
                        <TableHead className="text-center">Trend</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLeaderboard.map((item) => (
                        <TableRow key={item.rank} className="hover:bg-slate-50">
                          <TableCell className="font-bold text-lg">
                            {item.rank === 1 && <span className="text-yellow-500">🥇</span>}
                            {item.rank === 2 && <span className="text-slate-400">🥈</span>}
                            {item.rank === 3 && <span className="text-amber-600">🥉</span>}
                            {item.rank > 3 && <span className="text-slate-600">{item.rank}</span>}
                          </TableCell>
                          <TableCell className="font-medium">{item.document}</TableCell>
                          <TableCell className="text-center font-semibold">{item.views}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-100 text-green-700">{item.signRate}%</Badge>
                          </TableCell>
                          <TableCell className="text-center text-slate-600">{item.avgTime}</TableCell>
                          <TableCell className="text-center">
                            {item.trend === 'up' ? (
                              <TrendingUp className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-lg font-bold text-purple-600">{item.score}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DOCUMENTS REPORT */}
          {currentView === 'documents-report' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Documents Report</h2>
                <p className="text-slate-600">Comprehensive analytics for all your documents</p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Document</TableHead>
                        <TableHead className="text-center">Total Views</TableHead>
                        <TableHead className="text-center">Unique Viewers</TableHead>
                        <TableHead className="text-center">Avg Time Spent</TableHead>
                        <TableHead className="text-center">Signature Rate</TableHead>
                        <TableHead className="text-right">Avg Time to Sign</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDocuments.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleDocumentClick(doc)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-red-600" />
                              <span className="font-medium">{doc.name}</span>
                              {/* ADD DEAD DEAL BADGE HERE */}
          {doc.deadDealScore >= 80 && (
            <Badge variant="destructive" className="gap-1 text-xs text-white bg-red-600">
              ☠️ Dead
            </Badge>
          )}
          {doc.deadDealScore >= 60 && doc.deadDealScore < 80 && (
            <Badge className="gap-1 text-xs bg-orange-500">
              ⚠️ At Risk
            </Badge>
          )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">{doc.totalViews}</TableCell>
                          <TableCell className="text-center">{doc.uniqueViewers}</TableCell>
                          <TableCell className="text-center">{doc.avgTimeSpent}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-purple-100 text-purple-700">{doc.signatureRate}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-slate-600">{doc.avgTimeToSign}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* RECIPIENTS REPORT */}
          {currentView === 'recipients-report' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Recipients Report</h2>
                <p className="text-slate-600">Track engagement and status across all recipients</p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Recipient</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Opens</TableHead>
                        <TableHead className="text-center">Last Viewed</TableHead>
                        <TableHead className="text-center">Device</TableHead>
                        <TableHead className="text-right">Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLinkAnalytics.map((recipient, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                {recipient.recipientName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{recipient.recipientName}</p>
                                <p className="text-xs text-slate-500">{recipient.recipient}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={
                              recipient.status === 'signed' ? 'bg-green-100 text-green-700' :
                              recipient.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              recipient.status === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }>
                              {recipient.status === 'not-opened' ? 'Not Opened' : recipient.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {recipient.opened ? recipient.openCount : '-'}
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {recipient.lastViewed || 'Never'}
                          </TableCell>
                          <TableCell className="text-center">
                            {recipient.device ? (
                              <Badge variant="outline">{recipient.device}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-600">
                            {recipient.location || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STATUS REPORT */}
          {/* STATUS REPORT */}
{currentView === 'status-report' && (
  <div className="max-w-7xl mx-auto space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Status Report</h2>
      <p className="text-slate-600">Overview of document statuses across your workspace</p>
    </div>

    {/* Status Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Signed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">52</p>
              <p className="text-xs text-green-600 mt-1">↑ 18% vs last period</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">10</p>
              <p className="text-xs text-orange-600 mt-1">Same as last period</p>
            </div>
            <Clock className="h-12 w-12 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Declined</p>
              <p className="text-3xl font-bold text-red-600 mt-1">3</p>
              <p className="text-xs text-red-600 mt-1">↓ 25% vs last period</p>
            </div>
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Not Opened</p>
              <p className="text-3xl font-bold text-slate-600 mt-1">8</p>
              <p className="text-xs text-slate-500 mt-1">↓ 10% vs last period</p>
            </div>
            <Mail className="h-12 w-12 text-slate-400" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Status Trends Over Time */}
    <Card>
      <CardHeader>
        <CardTitle>Status Trends Over Time</CardTitle>
        <CardDescription>How document statuses have evolved</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockStatusTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="signed" stroke="#10B981" strokeWidth={2} name="Signed" />
            <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} name="Pending" />
            <Line type="monotone" dataKey="declined" stroke="#EF4444" strokeWidth={2} name="Declined" />
            <Line type="monotone" dataKey="notOpened" stroke="#64748B" strokeWidth={2} name="Not Opened" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    <div className="grid grid-cols-2 gap-6">
      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Visual breakdown of all document statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Signed', value: 52, color: '#10B981' },
                  { name: 'Pending', value: 10, color: '#F59E0B' },
                  { name: 'Declined', value: 3, color: '#EF4444' },
                  { name: 'Not Opened', value: 8, color: '#64748B' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {[
                  { name: 'Signed', value: 52, color: '#10B981' },
                  { name: 'Pending', value: 10, color: '#F59E0B' },
                  { name: 'Declined', value: 3, color: '#EF4444' },
                  { name: 'Not Opened', value: 8, color: '#64748B' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Decline Reasons Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Decline Reasons Breakdown</CardTitle>
          <CardDescription>Why documents are being declined</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockDeclineReasons.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">{item.reason}</span>
                    <Badge variant={item.trend === 'up' ? 'destructive' : 'secondary'}>
                      {item.count} ({item.percentage}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Decline Pattern Recognition */}
    <Card>
      <CardHeader>
        <CardTitle>🔍 Decline Pattern Recognition & Insights</CardTitle>
        <CardDescription>AI-powered analysis of why documents are being declined</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockDeclinePatterns.map((pattern, idx) => (
            <div key={idx} className="p-5 border-2 border-red-100 rounded-lg bg-red-50/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{pattern.pattern}</p>
                    <p className="text-sm text-slate-600">{pattern.count} occurrences</p>
                  </div>
                </div>
                <Badge variant="destructive">{idx + 1}</Badge>
              </div>
              
              <div className="ml-9 space-y-2">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-slate-700">💡 Insight:</span>
                  <p className="text-sm text-slate-600">{pattern.insight}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-green-700">✅ Recommendation:</span>
                  <p className="text-sm text-green-700 font-medium">{pattern.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-3">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Expert Insight from 10+ Years SaaS Experience</p>
              <p className="text-sm text-blue-700 mb-2">
                Based on patterns similar to DocuSign & DocSend data, your decline rate of 4% is actually below industry average (6-8%). 
                However, the high concentration of "Terms not acceptable" suggests:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                <li>Consider A/B testing different term structures</li>
                <li>Add negotiation options or alternative pricing tiers</li>
                <li>Include FAQ section addressing common concerns upfront</li>
                <li>Enable commenting/questions before requiring signature</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Detailed Status Table */}
    <Card>
      <CardHeader>
        <CardTitle>Detailed Status Breakdown by Document</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Document</TableHead>
              <TableHead className="text-center">Signed</TableHead>
              <TableHead className="text-center">Pending</TableHead>
              <TableHead className="text-center">Declined</TableHead>
              <TableHead className="text-center">Not Opened</TableHead>
              <TableHead className="text-right">Success Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDocuments.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-slate-50">
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-100 text-green-700">{doc.completed}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-orange-100 text-orange-700">{doc.pending}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-red-100 text-red-700">{doc.declined}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{doc.sent - doc.completed - doc.pending - doc.declined}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-bold text-purple-600">{doc.completionRate}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
)}
          {/* WORKSPACE ANALYTICS (OVERVIEW) */}
          {currentView === 'overview' && (
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Workspace Overview</h2>
                <p className="text-slate-600">Your document analytics at a glance</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total Documents</CardTitle>
                    <FileText className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">68</div>
                    <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">1,234</div>
                    <p className="text-xs text-green-600 mt-1">+18% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">78%</div>
                    <p className="text-xs text-green-600 mt-1">+5% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Avg. Time to Complete</CardTitle>
                    <Clock className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">2.4d</div>
                    <p className="text-xs text-red-600 mt-1">+0.3d from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Over Time</CardTitle>
                  <CardDescription>Views, clicks, and downloads</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { date: 'Jan 10', views: 12, clicks: 8, downloads: 5 },
                      { date: 'Jan 11', views: 19, clicks: 14, downloads: 9 },
                      { date: 'Jan 12', views: 15, clicks: 11, downloads: 7 },
                      { date: 'Jan 13', views: 25, clicks: 18, downloads: 12 },
                      { date: 'Jan 14', views: 22, clicks: 16, downloads: 10 },
                      { date: 'Jan 15', views: 30, clicks: 22, downloads: 15 },
                      { date: 'Jan 16', views: 28, clicks: 20, downloads: 13 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="views" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="clicks" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="downloads" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Documents</CardTitle>
                  <CardDescription>Your most viewed documents this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="text-center">Sent</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Completion</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDocuments.slice(0, 5).map((doc) => (
                        <TableRow key={doc.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleDocumentClick(doc)}>
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell className="text-center">{doc.sent}</TableCell>
                          <TableCell className="text-center">{doc.totalViews}</TableCell>
                          <TableCell className="text-center">{doc.completed}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-semibold">{doc.completionRate}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          

          {/* ALL DOCUMENTS VIEW */}
          {currentView === 'all-documents' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">All Documents</h2>
                  <p className="text-slate-600">Manage and analyze your shared documents</p>
                </div>
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* Documents Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Document Name</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead className="text-center">Pending</TableHead>
                      <TableHead className="text-center">Completed</TableHead>
                      <TableHead className="text-center">Declined</TableHead>
                      <TableHead className="text-center">Completion Rate</TableHead>
                      <TableHead className="text-center">Avg. Time</TableHead>
                      <TableHead className="text-right">Last Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className="cursor-pointer hover:bg-purple-50 transition-colors"
                          onClick={() => handleDocumentClick(doc)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{doc.name}</p>
                                <p className="text-xs text-slate-500">{doc.owner}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">{doc.sent}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-orange-600 font-medium">{doc.pending}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-green-600 font-medium">{doc.completed}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-red-600 font-medium">{doc.declined}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-purple-600">{doc.completionRate}</span>
                          </TableCell>
                          <TableCell className="text-center text-slate-600">{doc.avgTime}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">
                            {new Date(doc.lastSent).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                          No documents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}


          

         
          {/* DOCUMENT DETAIL VIEW */}
          {currentView === 'document-detail' && selectedDocument && (
            <div className="max-w-7xl mx-auto space-y-6">
              <Button variant="ghost" onClick={handleBackToList} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to All Documents
              </Button>

               {/* DEAD DEAL ALERT - Show at top of document detail */}
{selectedDocument && selectedDocument.deadDealScore >= 60 && (
  <Card className="border-2 border-red-500 bg-red-50">
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <XCircle className="h-10 w-10 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-red-900">
              {selectedDocument.deadDealScore >= 80 ? '☠️ DEAD DEAL DETECTED' : '⚠️ DEAL AT HIGH RISK'}
            </h3>
            <Badge variant="destructive" className="text-lg">
              {selectedDocument.deadDealScore}% Dead
            </Badge>
          </div>
          
          <p className="text-sm text-red-800 mb-4">
            Our AI analysis indicates this deal has a <strong>{selectedDocument.deadDealScore}% probability of being lost</strong> with 
            only <strong>{100 - selectedDocument.deadDealScore}% chance of recovery</strong>.
          </p>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm font-semibold text-red-900">Critical Signals:</p>
           {selectedDocument.deadDealSignals.map(
  (signal: DeadDealSignal, idx: number) => (

              <div key={idx} className="flex items-center gap-2 text-sm text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span>{signal.signal}</span>
                <Badge variant={signal.severity === 'high' ? 'destructive' : 'secondary'}>
                  {signal.severity}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button variant="destructive" size="sm">
              Mark as Lost
            </Button>
            <Button variant="outline" size="sm">
              Last-Ditch Recovery Plan
            </Button>
            <Button variant="ghost" size="sm">
              See Full Analysis
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}


              {/* Document Header */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-red-100 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedDocument.name}</h2>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Owner: {selectedDocument.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Last sent: {new Date(selectedDocument.lastSent).toLocaleDateString()}
                        </span>
                        <Badge className="bg-green-100 text-green-700">{selectedDocument.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share Again
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Basic/Advanced Toggle */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm font-medium text-slate-700">View:</span>
                  <Button
                    variant={analyticsView === 'basic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAnalyticsView('basic')}
                    className={analyticsView === 'basic' ? 'bg-purple-600' : ''}
                  >
                    📊 Basic
                  </Button>
                  <Button
                    variant={analyticsView === 'advanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAnalyticsView('advanced')}
                    className={analyticsView === 'advanced' ? 'bg-purple-600' : ''}
                  >
                    🚀 Advanced
                  </Button>
                </div>
              </div>

              {/* BASIC VIEW */}
              {analyticsView === 'basic' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>📬 Link Analytics - Quick Overview</CardTitle>
                      <CardDescription>Who opened your document and when</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockLinkAnalytics.map((recipient, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                                {recipient.recipientName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{recipient.recipientName}</p>
                                <p className="text-sm text-slate-500">{recipient.recipient}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {recipient.opened ? (
                                    <Badge className="bg-green-100 text-green-700">
                                      ✓ Opened {recipient.openCount}x
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Not Opened</Badge>
                                  )}
                                </p>
                                {recipient.lastViewed && (
                                  <p className="text-xs text-slate-500 mt-1">Last: {recipient.lastViewed}</p>
                                )}
                              </div>
                              <Badge className={
                                recipient.status === 'signed' ? 'bg-green-100 text-green-700' :
                                recipient.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                recipient.status === 'declined' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }>
                                {recipient.status === 'not-opened' ? 'Pending' : recipient.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Engagement Summary</CardTitle>
                      <CardDescription>How people are interacting with your document</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-slate-600 mb-1">Total Opens</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {mockLinkAnalytics.reduce((sum, r) => sum + r.openCount, 0)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-slate-600 mb-1">Signed</p>
                          <p className="text-3xl font-bold text-green-600">
                            {mockLinkAnalytics.filter(r => r.status === 'signed').length}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-slate-600 mb-1">Pending</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {mockLinkAnalytics.filter(r => r.status === 'pending' || !r.opened).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>⏱️ Signature Speed</CardTitle>
                      <CardDescription>How quickly people are signing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm text-slate-600 mb-2">Average Time to Sign</p>
                          <p className="text-4xl font-bold text-slate-900">{selectedDocument.avgTimeToSign}</p>
                        </div>
                        <Clock className="h-16 w-16 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ADVANCED VIEW */}
              {analyticsView === 'advanced' && (
                <Tabs defaultValue="link-analytics" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                   <TabsTrigger value="link-analytics">Link Analytics</TabsTrigger>
  <TabsTrigger value="engagement">Page Overview</TabsTrigger>
  <TabsTrigger value="recipient-pages">By Recipient</TabsTrigger> {/* NEW */}
  <TabsTrigger value="signature-friction">Signature Friction</TabsTrigger>
  <TabsTrigger value="reminders">Reminders</TabsTrigger>
  <TabsTrigger value="intent">Intent</TabsTrigger>
  <TabsTrigger value="decline-analysis">Declines</TabsTrigger>
  <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>

                  {/* Link Analytics Tab */}
                  <TabsContent value="link-analytics" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>  Advanced Link Analytics</CardTitle>
                        <CardDescription>Detailed tracking of every recipient</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead>Recipient</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Opens</TableHead>
                              <TableHead className="text-center">First Opened</TableHead>
                              <TableHead className="text-center">Last Viewed</TableHead>
                              <TableHead className="text-center">Device</TableHead>
                              <TableHead className="text-right">Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockLinkAnalytics.map((recipient, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                      {recipient.recipientName.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{recipient.recipientName}</p>
                                      <p className="text-xs text-slate-500">{recipient.recipient}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={
                                    recipient.status === 'signed' ? 'bg-green-100 text-green-700' :
                                    recipient.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                    recipient.status === 'declined' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-700'
                                  }>
                                    {recipient.status === 'not-opened' ? 'Not Opened' : recipient.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center font-semibold">
                                  {recipient.opened ? recipient.openCount : '-'}
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  {recipient.firstOpened || '-'}
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  {recipient.lastViewed || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {recipient.device ? (
                                    <Badge variant="outline" className="gap-1">
                                      <Smartphone className="h-3 w-3" />
                                      {recipient.device}
                                    </Badge>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {recipient.location || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Engagement Depth Tab */}
                  {/* Engagement Depth Tab */}
<TabsContent value="engagement" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>📖 Page-by-Page Engagement Analysis</CardTitle>
      <CardDescription>Detailed time spent and completion rates per page</CardDescription>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={mockPageEngagement}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="page" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="timeSpent" fill="#8B5CF6" name="Total Time (seconds)" />
          <Bar yAxisId="left" dataKey="views" fill="#3B82F6" name="Views" />
          <Bar yAxisId="right" dataKey="completionRate" fill="#10B981" name="Completion Rate (%)" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  {/* Detailed Page Analytics Table */}
  <Card>
    <CardHeader>
      <CardTitle>⏱️ Time Spent Per Page</CardTitle>
      <CardDescription>How long users spend on each page</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Page</TableHead>
            <TableHead className="text-center">Total Views</TableHead>
            <TableHead className="text-center">Avg Time/User</TableHead>
            <TableHead className="text-center">Total Time</TableHead>
            <TableHead className="text-center">Completion Rate</TableHead>
            <TableHead className="text-right">Drop-off Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPageEngagement.map((page, idx) => (
            <TableRow key={idx} className="hover:bg-slate-50">
              <TableCell className="font-semibold">{page.page}</TableCell>
              <TableCell className="text-center">{page.views}</TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{page.avgTimePerUser}</Badge>
              </TableCell>
              <TableCell className="text-center">{page.timeSpent}s</TableCell>
              <TableCell className="text-center">
                <Badge className="bg-green-100 text-green-700">{page.completionRate}%</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={page.dropOffRate > 20 ? 'destructive' : 'secondary'}>
                  {page.dropOffRate}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <div className="grid grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>  Most Engaged Page</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6 bg-purple-50 rounded-lg">
          <p className="text-5xl font-bold text-purple-600">Page 1</p>
          <p className="text-sm text-slate-600 mt-2">12s avg time per user</p>
          <p className="text-xs text-green-600 mt-1">95% completion rate</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>⏰ Longest Time Spent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <p className="text-5xl font-bold text-blue-600">Page 1</p>
          <p className="text-sm text-slate-600 mt-2">145s total time</p>
          <p className="text-xs text-slate-500 mt-1">Highest engagement</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>⚠️ Biggest Drop-off</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <p className="text-5xl font-bold text-red-600">Page 5</p>
          <p className="text-sm text-slate-600 mt-2">33% drop-off rate</p>
          <p className="text-xs text-red-600 mt-1">Needs attention</p>
        </div>
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>💡 Page Engagement Insights</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 mb-1">Strong Opening</p>
              <p className="text-sm text-green-700">
                Page 1 maintains 95% completion with 12s average engagement - users are hooked early
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Critical Drop-off on Page 5</p>
              <p className="text-sm text-red-700">
                33% drop-off suggests content issue. Consider: shortening page, adding visuals, or moving critical info earlier
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-3">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Pro Tip</p>
              <p className="text-sm text-blue-700">
                Pages with 8+ seconds per user typically indicate complex content. Consider adding tooltips or explanatory sidebars.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>

<TabsContent value="recipient-pages" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>👤 Individual Recipient Page Analytics</CardTitle>
      <CardDescription>See exactly how each person engaged with every page</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {mockRecipientPageTracking.map((recipient, idx) => (
          <div key={idx} className={`p-5 border-2 rounded-lg ${
            recipient.bounced ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
          }`}>
            {/* Recipient Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {recipient.recipientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{recipient.recipientName}</p>
                  <p className="text-sm text-slate-600">{recipient.recipientEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Total Time on Document</p>
                <p className="text-2xl font-bold text-purple-600">{recipient.totalTimeOnDoc}</p>
                {recipient.bounced && (
                  <Badge variant="destructive" className="mt-1">
                    🚨 Bounced
                  </Badge>
                )}
              </div>
            </div>

            {/* Bounce Warning */}
            {recipient.bounced && recipient.totalTimeOnDoc === '0s' && (
              <div className="mb-4 p-3 bg-red-100 rounded-lg border border-red-300">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">❌ Never Opened</p>
                    <p className="text-sm text-red-700">This recipient has not opened the document yet.</p>
                  </div>
                </div>
              </div>
            )}

            {recipient.bounced && recipient.totalTimeOnDoc !== '0s' && (
              <div className="mb-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-900">⚠️ Quick Exit Detected</p>
                    <p className="text-sm text-orange-700">
                      Opened and closed in under 30 seconds. Low engagement - consider follow-up.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Page-by-Page Breakdown */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700 mb-3">📄 Page-by-Page Activity:</p>
              
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-20">Page</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Time Spent</TableHead>
                    <TableHead className="text-center">Scroll Depth</TableHead>
                    <TableHead className="text-center">Visits</TableHead>
                    <TableHead className="text-right">Insights</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipient.pageData.map((pageInfo, pIdx) => (
                    <TableRow 
                      key={pIdx} 
                      className={pageInfo.skipped ? 'bg-red-50' : 'hover:bg-slate-50'}
                    >
                      <TableCell className="font-semibold">Page {pageInfo.page}</TableCell>
                      <TableCell className="text-center">
                        {pageInfo.skipped ? (
                          <Badge variant="destructive">❌ Skipped</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">✓ Viewed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {pageInfo.skipped ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <Badge variant="outline">{pageInfo.timeSpent}s</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {pageInfo.skipped ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  pageInfo.scrollDepth >= 80 ? 'bg-green-500' :
                                  pageInfo.scrollDepth >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${pageInfo.scrollDepth}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{pageInfo.scrollDepth}%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {pageInfo.skipped ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <span className="font-semibold">{pageInfo.visits}x</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {!pageInfo.skipped && pageInfo.timeSpent > 180 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            🔥 High interest
                          </Badge>
                        )}
                        {!pageInfo.skipped && pageInfo.visits > 1 && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 ml-1">
                            🔄 Re-visited
                          </Badge>
                        )}
                        {!pageInfo.skipped && pageInfo.scrollDepth < 50 && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 ml-1">
                            ⚠️ Partial read
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Skip Pattern Detection */}
            {recipient.pageData.filter(p => p.skipped).length > 0 && !recipient.bounced && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">
                      ⏭️ Skipped {recipient.pageData.filter(p => p.skipped).length} page(s)
                    </p>
                    <p className="text-sm text-yellow-700">
                      Pages skipped: {recipient.pageData.filter(p => p.skipped).map(p => `Page ${p.page}`).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* High Engagement Insight */}
            {!recipient.bounced && recipient.pageData.some(p => p.timeSpent > 180) && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex gap-2">
                  <Star className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      🌟 High Engagement Detected
                    </p>
                    <p className="text-sm text-green-700">
                      Spent 3+ minutes on specific pages - shows strong interest. Great candidate for follow-up!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bounce Rate Summary */}
      <Card className="mt-6 border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Bounce Rate Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Total Recipients</p>
              <p className="text-3xl font-bold text-slate-900">{mockBounceAnalytics.totalRecipients}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-slate-600">Bounced</p>
              <p className="text-3xl font-bold text-red-600">{mockBounceAnalytics.bounced}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-slate-600">Engaged</p>
              <p className="text-3xl font-bold text-green-600">{mockBounceAnalytics.engaged}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-slate-600">Bounce Rate</p>
              <p className="text-3xl font-bold text-orange-600">{mockBounceAnalytics.bounceRate}%</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">💡 Bounce Rate Insight</p>
                <p className="text-sm text-blue-700">
                  Industry average bounce rate is 40-60%. Your {mockBounceAnalytics.bounceRate}% indicates 
                  {mockBounceAnalytics.bounceRate < 40 ? ' excellent targeting and relevance!' : 
                   mockBounceAnalytics.bounceRate > 60 ? ' you may need to improve targeting or subject lines.' :
                   ' normal engagement levels.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </CardContent>
  </Card>
</TabsContent>
                  {/* Signature Friction Tab */}
                  <TabsContent value="signature-friction" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>✍️ Signature Friction Analysis</CardTitle>
                        <CardDescription>Identify where signers hesitate or drop off</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockSignatureFriction.map((step, idx) => (
                            <div key={idx} className="relative">
                              <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                <div className="flex items-center gap-4">
                                  <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white ${
                                    idx === 0 ? 'bg-green-500' :
                                    idx === 1 ? 'bg-blue-500' :
                                    idx === 2 ? 'bg-orange-500' :
                                    'bg-purple-500'
                                  }`}>
                                    {step.users}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{step.step}</p>
                                    <p className="text-sm text-slate-500">Average time: {step.avgTime}</p>
                                  </div>
                                </div>
                                {step.dropOff > 0 && (
                                  <Badge variant="destructive" className="gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    {step.dropOff}% drop-off
                                  </Badge>
                                )}
                              </div>
                              {idx < mockSignatureFriction.length - 1 && (
                                <div className="h-8 w-0.5 bg-slate-200 ml-6 my-1" />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex gap-3">
                            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-blue-900 mb-1">💡 Insight</p>
                              <p className="text-sm text-blue-700">
                                20% of users drop off before completing signing. Consider simplifying the signature process 
                                or adding a reminder email at this stage.
                              </p>
                            </div>
                          </div>
                          </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reminder Effectiveness Tab */}
              <TabsContent value="reminders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🔔 Reminder Effectiveness</CardTitle>
                    <CardDescription>How reminders impact signature rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mockReminderData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="reminderType" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="signRate" fill="#10B981" name="Sign Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {mockReminderData.map((data, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <p className="text-sm font-semibold text-slate-700 mb-2">{data.reminderType}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-green-600">{data.signRate}%</span>
                            <span className="text-sm text-slate-500">{data.avgTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Intent/Interest Tab */}
              <TabsContent value="intent" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🎯 Intent & Interest Signals</CardTitle>
                    <CardDescription>AI-powered analysis of recipient interest levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                        <Flame className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-green-600">{mockIntentData.highIntent}</p>
                        <p className="text-sm text-slate-600 mt-1">High Intent</p>
                      </div>
                      <div className="text-center p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <Target className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-yellow-600">{mockIntentData.mediumIntent}</p>
                        <p className="text-sm text-slate-600 mt-1">Medium Intent</p>
                      </div>
                      <div className="text-center p-6 bg-slate-50 rounded-lg border-2 border-slate-200">
                        <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-slate-600">{mockIntentData.lowIntent}</p>
                        <p className="text-sm text-slate-600 mt-1">Low Intent</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="font-semibold text-slate-900">Interest Signals Detected:</p>
                      {mockIntentData.signals.map((signal, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-700">{signal.signal}</span>
                          <Badge variant="secondary">{signal.count} recipients</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🔒 Link Security Analytics</CardTitle>
                    <CardDescription>Track access patterns and security events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockLinkAnalytics.filter(r => r.opened).map((recipient, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                                {recipient.recipientName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{recipient.recipientName}</p>
                                <p className="text-xs text-slate-500">{recipient.recipient}</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700 gap-1">
                              <Shield className="h-3 w-3" />
                              Verified
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 mb-1">IP Address</p>
                              <p className="font-mono text-slate-900">{recipient.ip}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 mb-1">Location</p>
                              <p className="text-slate-900">{recipient.location}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 mb-1">Device</p>
                              <p className="text-slate-900">{recipient.device}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900 mb-1">All Clear</p>
                          <p className="text-sm text-green-700">
                            No suspicious activity detected. All access attempts match expected patterns.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Add this new tab after the Security tab */}
<TabsTrigger value="decline-analysis">Decline Analysis</TabsTrigger>

{/* Add this TabsContent after Security TabsContent */}
<TabsContent value="decline-analysis" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>❌ Decline Reasons & Analysis</CardTitle>
      <CardDescription>Understanding why recipients declined to sign</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {mockLinkAnalytics
          .filter(r => r.status === 'declined')
          .map((recipient, idx) => (
            <div key={idx} className="p-5 border-2 border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">
                    {recipient.recipientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{recipient.recipientName}</p>
                    <p className="text-sm text-slate-600">{recipient.recipient}</p>
                  </div>
                </div>
                <Badge variant="destructive">Declined</Badge>
              </div>

              <div className="ml-13 space-y-3">
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-slate-700 mb-1">📋 Decline Reason:</p>
                  <p className="text-sm text-red-700 font-semibold">"Terms not acceptable"</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Declined on:</p>
                    <p className="font-medium">Page 3 - Pricing Section</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Time before decline:</p>
                    <p className="font-medium">4m 32s</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Pages viewed:</p>
                    <p className="font-medium">3 of 5</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Return visits:</p>
                    <p className="font-medium">1 (re-checked terms)</p>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">Pattern Detected:</p>
                      <p className="text-sm text-yellow-800">
                        Recipient spent significant time on pricing page before declining. 
                        This suggests price sensitivity or budget constraints rather than disinterest.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex gap-2">
                    <Zap className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 mb-1">Recommended Action:</p>
                      <p className="text-sm text-green-800">
                        • Re-engage with alternative pricing options<br/>
                        • Offer payment plan or discount for quick decision<br/>
                        • Schedule call to address specific concerns
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Summary Insights */}
      <div className="mt-6 p-5 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex gap-3">
          <Award className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-blue-900 mb-2">Expert Analysis (Based on 10+ Years SaaS Experience)</p>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                <strong>Pattern Recognition:</strong> Your declines show a common B2B SaaS pattern - recipients 
                are engaging deeply (4+ minutes) before declining, indicating genuine consideration.
              </p>
              <p>
                <strong>Industry Benchmark:</strong> Average decline rate is 6-8%. Your 4% is excellent, 
                but each decline represents a recoverable opportunity.
              </p>
              <p className="pt-2 border-t border-blue-200">
                <strong>🎯 Top 3 Recovery Strategies:</strong>
              </p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Follow up within 24 hours with personalized pricing alternatives</li>
                <li>Use decline reason to tailor your pitch ("I see pricing was a concern...")</li>
                <li>Offer time-limited discount or flexible payment terms to re-engage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </main>
  </div>
</div>
)
}
