// components/SignatureDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, Clock, Users, CheckCircle, Eye, AlertCircle,
  Download, Mail, MapPin, Monitor, Smartphone, Tablet,
  Calendar, TrendingUp, Loader2, Send, RefreshCw, ExternalLink,
  ChevronRight, Globe, Target, Activity, MousePointer,
  X,
  XCircle,
  Archive, 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import GeoHeatMap from './GeoHeatMap';
 

interface Signer {
  name: string;
  email: string;
  status: 'pending' | 'viewed' | 'signed';
  uniqueId: string;
  viewedAt?: string;
  signedAt?: string;
  device?: string;
  browser?: string;
  location?: {
    city: string;
    country: string;
  };
  totalViews?: number;
  totalTimeSpent?: number;
  engagement?: 'high' | 'medium' | 'low';
}

interface SignatureDocument {
  id: string;
  documentId: string;
  name: string;
  documentName: string;
  totalSigners: number;
  signedCount: number;
  pendingCount: number;
  completionRate: number;
  views: number;
  status: string;
  createdAt: string;
  signers: Signer[];
  uniqueId: string;
}

interface SignatureStats {
  totalRequests: number;
  pendingRequests: number;
  viewedRequests: number;
  signedRequests: number;
  uniqueSigners: number;
  avgTimeToSign: number;
  completionRate: number;
  
  deviceBreakdown?: {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  };
  
  browserStats?: { [key: string]: number };
  osStats?: { [key: string]: number };
  timeSpentAnalytics?: {
    average: number;
    min: number;
    max: number;
    total: number;
  };
  trending: {
    signedChange: number;
  };
  requestsOverTime: Array<{ date: string; sent: number; signed: number }>;
  topDocuments: SignatureDocument[];
  recentActivity: Array<{
    id: string;
    type: 'sent' | 'viewed' | 'signed';
    documentName: string;
    signerName: string;
    signerEmail: string;
    timestamp: string;
  }>;
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
  signerEngagement: Array<{ segment: string; count: number; avgTime: number }>;
  // ⭐ ADD THESE NEW FIELDS:
  dropOffAnalysis?: {
    viewedButNotSigned: number;
    neverViewed: number;
    dropOffRate: number;
    totalAbandoned: number;
  };

  locationStats?: { [key: string]: number };
  countryStats?: { [key: string]: number };

  geoMapData?: Array<{
    lat: number;
    lng: number;
    city: string;
    country: string;
    count: number;
  }>;

  pageAnalytics?: Array<{
    page: number;
    views: number;
    exits: number;
    exitRate: number;
  }>;
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function SignatureDashboard() {
  const [stats, setStats] = useState<SignatureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
 const [showCancelConfirm, setShowCancelConfirm] = useState(false);
const [cancelReason, setCancelReason] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<SignatureDocument | null>(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState<Signer | null>(null);
  const [showSignerDetails, setShowSignerDetails] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [bulkSends, setBulkSends] = useState<any[]>([]);
const [loadingBulkSends, setLoadingBulkSends] = useState(false);
const router = useRouter();
const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchSignatureStats();
    const interval = setInterval(fetchSignatureStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange, showArchived]);


  const fetchSignatureStats = async () => {
  try {
    const res = await fetch(`/api/dashboard/signature-stats?range=${timeRange}&archived=${showArchived}`, {
      credentials: 'include',
    });
    
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setError(null);
    } else {
      throw new Error('Failed to fetch stats');
    }
  } catch (err) {
    console.error('Signature stats error:', err);
    setError('Failed to load signature data');
  } finally {
    setLoading(false);
  }
};

  const handleCancelRequest = async (signatureId: string, documentName: string, reason: string = '') => {
  if (!signatureId) {
    alert('Error: Missing signatureId for the signature request.');
    return;
  }

  if (!reason && !confirm(`Are you sure you want to cancel this signature request for "${documentName}" without a reason?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/signature/${signatureId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'No reason provided' }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert(`✅ Signature request cancelled. ${data.cancelledCount} recipient(s) notified.`);
      fetchSignatureStats();
    } else {
      alert(data.message || 'Failed to cancel request');
    }
  } catch (error) {
    console.error('Cancel error:', error);
    alert('Failed to cancel request');
  }
};

const handleArchiveDocument = async (signatureId: string) => {
  if (!confirm('Archive this document? You can view it in the Archived tab.')) {
    return;
  }

  try {
    const res = await fetch(`/api/signature/${signatureId}/archive`, {
      method: 'POST',
      credentials: 'include',
    });

    if (res.ok) {
      alert('✅ Document archived successfully!');
      setShowDocumentDetails(false);
      fetchSignatureStats();
    } else {
      alert('Failed to archive document');
    }
  } catch (error) {
    console.error('Archive error:', error);
    alert('Failed to archive document');
  }
};

const handleUnarchiveDocument = async (signatureId: string) => {
  try {
    const res = await fetch(`/api/signature/${signatureId}/archive`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      alert('✅ Document restored successfully!');
      setShowDocumentDetails(false);
      fetchSignatureStats();
    } else {
      alert('Failed to restore document');
    }
  } catch (error) {
    console.error('Unarchive error:', error);
    alert('Failed to restore document');
  }
};

const fetchBulkSends = async () => {
  setLoadingBulkSends(true);
  try {
    const res = await fetch("/api/bulk-send/list", {
      credentials: "include",
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setBulkSends(data.bulkSends);
      }
    }
  } catch (error) {
    console.error("Failed to fetch bulk sends:", error);
  } finally {
    setLoadingBulkSends(false);
  }
};

// Call on mount
useEffect(() => {
  fetchBulkSends();
}, []);


  const handleSendReminder = async (signatureId: string) => {
    setSendingReminder(signatureId);
    try {
      const res = await fetch(`/api/signature/${signatureId}/remind`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (res.ok) {
        alert('Reminder sent successfully!');
      } else {
        alert('Failed to send reminder');
      }
    } catch (err) {
      console.error('Send reminder error:', err);
      alert('Error sending reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const handleDownloadSigned = async (signatureId: string) => {
    window.open(`/api/signature/${signatureId}/download`, '_blank');
  };

  const handleViewSignerDetails = async (signer: Signer) => {
    setSelectedSigner(signer);
    setShowSignerDetails(true);
    
    // Fetch detailed analytics
    try {
      const res = await fetch(`/api/signature/${signer.uniqueId}`, {
  credentials: 'include',
});
      if (res.ok) {
        const data = await res.json();
        setSelectedSigner({
          ...signer,
          device: data.signature.device,
          browser: data.signature.browser,
          location: data.signature.location,
          totalViews: data.signature.totalViews,
          totalTimeSpent: data.signature.totalTimeSpent,
          engagement: data.signature.engagement,
        });
      }
    } catch (err) {
      console.error('Fetch signer details error:', err);
    }
  };

  const formatTimeSpent = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'signed': return 'bg-green-100 text-green-700 border-green-200';
      case 'viewed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';  //   Add this
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'signed': return <CheckCircle className="h-4 w-4" />;
      case 'viewed': return <Eye className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getEngagementColor = (level: 'high' | 'medium' | 'low') => {
    switch(level) {
      case 'high': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading signature analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-900 font-medium">{error || 'Failed to load dashboard'}</p>
        <button
          onClick={fetchSignatureStats}
          className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">E-Signature Analytics</h2>
          <p className="text-sm text-slate-600 mt-1">Track signature requests and signer engagement</p>
        </div>
          <div className="flex gap-3"> 
         {/* ✅ ADD CSV EXPORT BUTTON */}
    <button
      onClick={() => {
        window.open(`/api/dashboard/export-csv?range=${timeRange}`, '_blank');
      }}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </button>
        
        <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>
    </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Sent</CardTitle>
            <Send className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalRequests}</div>
            <p className="text-sm text-slate-500 mt-2">
              <span className="font-medium text-green-600">{stats.completionRate}%</span> completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.pendingRequests}</div>
            <p className="text-sm text-slate-500 mt-2">
              <span className="font-medium text-yellow-600">{stats.viewedRequests}</span> viewed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Signed</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.signedRequests}</div>
            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
              {stats.trending.signedChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : null}
              <span className={stats.trending.signedChange > 0 ? 'text-green-600 font-medium' : 'text-slate-600'}>
                {stats.trending.signedChange > 0 ? '+' : ''}{stats.trending.signedChange}%
              </span>
              <span className="text-slate-500">vs last period</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg. Time</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatTimeSpent(stats.avgTimeToSign)}</div>
            <p className="text-sm text-slate-500 mt-2">to sign</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="bulk-sends">Bulk Sends</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Drop-off Analysis */}
{stats.dropOffAnalysis && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-600" />
        Drop-off Analysis
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Drop-off Rate</p>
            <p className="text-3xl font-bold text-red-600">
              {stats.dropOffAnalysis.dropOffRate}%
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Total Abandoned</p>
            <p className="text-3xl font-bold text-orange-600">
              {stats.dropOffAnalysis.totalAbandoned}
            </p>
          </div>
        </div>
        
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Viewed but not signed</span>
            <span className="font-medium text-red-600">
              {stats.dropOffAnalysis.viewedButNotSigned}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Never opened</span>
            <span className="font-medium text-orange-600">
              {stats.dropOffAnalysis.neverViewed}
            </span>
          </div>
        </div>

        {stats.dropOffAnalysis.dropOffRate > 30 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>High drop-off detected!</strong> Consider simplifying your documents or following up with reminders.
            </p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}

{/* Page Analytics */}
{stats.pageAnalytics && stats.pageAnalytics.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-indigo-600" />
        Page-by-Page Analysis
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {stats.pageAnalytics.map((page) => (
          <div key={page.page}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Page {page.page}</span>
              <span className="text-slate-600">
                {page.views} views • {page.exits} exits ({page.exitRate}%)
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  page.exitRate > 50 ? 'bg-red-500' :
                  page.exitRate > 30 ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${page.exitRate}%` }}
              />
            </div>
            {page.exitRate > 50 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ High exit rate - consider simplifying this page
              </p>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}

{/* Geographic Distribution */}
{stats.locationStats && Object.keys(stats.locationStats).length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-green-600" />
        Top Locations
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {Object.entries(stats.locationStats)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([location, count]) => {
            const percentage = Math.round((count / stats.totalRequests) * 100);
            return (
              <div key={location}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{location}</span>
                  <span className="text-slate-600">{count} ({percentage}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </CardContent>
  </Card>
)}

{/* Country Breakdown */}
{stats.countryStats && Object.keys(stats.countryStats).length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-blue-600" />
        Countries
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={Object.entries(stats.countryStats)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([country, count]) => ({ country, count }))
        }>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="country" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          />
          <Bar dataKey="count" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)}
{/* Geographic Heat Map */}
{stats.geoMapData && stats.geoMapData.length > 0 && (
  <Card className="md:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-purple-600" />
        Geographic Heat Map
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="relative w-full h-96 bg-slate-100 rounded-lg overflow-hidden">
        {/* Simple visualization - you can enhance with a proper map library later */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-sm text-slate-600 mb-2">
              Signatures from {stats.geoMapData.length} locations
            </p>
            <div className="max-w-md mx-auto space-y-2">
              {stats.geoMapData
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((location, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">
                        {location.city}, {location.country}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600">{location.count} signatures</span>
                  </div>
                ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              💡 Tip: You can integrate Google Maps or Mapbox for a visual map
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
{stats.geoMapData && stats.geoMapData.length > 0 && (
  <Card className="md:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-purple-600" />
        Geographic Heat Map
      </CardTitle>
    </CardHeader>
    <CardContent>
      <GeoHeatMap data={stats.geoMapData} />
    </CardContent>
  </Card>
)}
          {/* Signature Requests Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Signature Requests Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.requestsOverTime}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSigned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="sent" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorSent)" name="Sent" />
                  <Area type="monotone" dataKey="signed" stroke="#10B981" fillOpacity={1} fill="url(#colorSigned)" name="Signed" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
           {/* ✅ ADD NEW ANALYTICS SECTION */}
  <div className="grid md:grid-cols-2 gap-6">
    {/* Device Breakdown */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-blue-600" />
          Device Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.deviceBreakdown ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Mobile', value: stats.deviceBreakdown.mobile, color: '#8B5CF6' },
                    { name: 'Desktop', value: stats.deviceBreakdown.desktop, color: '#3B82F6' },
                    { name: 'Tablet', value: stats.deviceBreakdown.tablet, color: '#10B981' },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Mobile', value: stats.deviceBreakdown.mobile, color: '#8B5CF6' },
                    { name: 'Desktop', value: stats.deviceBreakdown.desktop, color: '#3B82F6' },
                    { name: 'Tablet', value: stats.deviceBreakdown.tablet, color: '#10B981' },
                  ].filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-600" />
                  <span>Mobile</span>
                </div>
                <span className="font-medium">{stats.deviceBreakdown.mobile}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-blue-600" />
                  <span>Desktop</span>
                </div>
                <span className="font-medium">{stats.deviceBreakdown.desktop}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Tablet className="h-4 w-4 text-green-600" />
                  <span>Tablet</span>
                </div>
                <span className="font-medium">{stats.deviceBreakdown.tablet}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600 text-center py-8">No device data available</p>
        )}
      </CardContent>
    </Card>

    {/* Time Spent Analytics */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Time Spent on Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.timeSpentAnalytics && stats.timeSpentAnalytics.total > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Average</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatTimeSpent(stats.timeSpentAnalytics.average)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Minimum</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatTimeSpent(stats.timeSpentAnalytics.min)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Maximum</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatTimeSpent(stats.timeSpentAnalytics.max)}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-slate-600 text-center">
                Based on {stats.timeSpentAnalytics.total} completed signatures
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 text-center py-8">
            No time tracking data available yet
          </p>
        )}
      </CardContent>
    </Card>

    {/* Browser Stats */}
    {stats.browserStats && Object.keys(stats.browserStats).length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            Browser Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.browserStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([browser, count]) => {
                const percentage = Math.round((count / stats.totalRequests) * 100);
                return (
                  <div key={browser}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{browser}</span>
                      <span className="text-slate-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    )}

    {/* OS Stats */}
    {stats.osStats && Object.keys(stats.osStats).length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-teal-600" />
            Operating Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.osStats)
              .sort(([, a], [, b]) => b - a)
              .map(([os, count]) => {
                const percentage = Math.round((count / stats.totalRequests) * 100);
                return (
                  <div key={os}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{os}</span>
                      <span className="text-slate-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Signature Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.conversionFunnel.map((stage, index) => (
                    <div key={stage.stage}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{stage.stage}</span>
                        <span className="text-slate-600">{stage.count} ({stage.percentage}%)</span>
                      </div>
                      <div className="h-8 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full flex items-center justify-end px-3 text-white text-xs font-medium transition-all`}
                          style={{ 
                            width: `${stage.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        >
                          {stage.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Signer Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Signer Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.signerEngagement.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{segment.segment} Engagement</p>
                        <p className="text-sm text-slate-600">
                          Avg. {formatTimeSpent(segment.avgTime)}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{segment.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Signature Documents</h3>
              <p className="text-sm text-slate-600">Click to view detailed signer analytics</p>
            </div>
            <div className="text-sm text-slate-600">
              {stats.topDocuments.length} documents
            </div>
          </div>

          {stats.topDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Signature Requests Yet</h3>
                <p className="text-sm text-slate-600">Send documents for signature to see analytics here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {stats.topDocuments.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500"
                  onClick={() => {
                    setSelectedDocument(doc);
                    setShowDocumentDetails(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-lg mb-2 truncate">
                            {doc.name}
                          </h4>
                          
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">
                                {doc.signedCount} of {doc.totalSigners} signed
                              </span>
                              <span className="font-medium text-purple-600">{doc.completionRate}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                                style={{ width: `${doc.completionRate}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span className="font-medium">{doc.views}</span> views
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">{doc.totalSigners}</span> signers
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">{doc.signedCount}</span> completed
                            </div>
                            {doc.pendingCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">{doc.pendingCount}</span> pending
                              </div>
                            )}
                          </div>

                          {/* Signers Preview */}
                          {doc.signers.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {doc.signers.slice(0, 3).map((signer, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(signer.status)}`}
                                >
                                  {getStatusIcon(signer.status)}
                                  {signer.email}
                                </span>
                              ))}
                              {doc.signers.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                  +{doc.signers.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium ml-4">
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
         {/* Bulk Sends Tab */}
        <TabsContent value="bulk-sends" className="space-y-6">
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-slate-900">Bulk Sends</h2>
      <Button
        onClick={() => router.push("/bulk-send/new")}
        className="flex items-center gap-2"
      >
        <Send className="h-4 w-4" />
        Send Bulk
      </Button>
    </div>
    {loadingBulkSends ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    ) : bulkSends.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-lg border">
        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Bulk Sends Yet
        </h3>
        <p className="text-slate-600 mb-6">
          Send documents to multiple recipients at once
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Browse Documents
        </Button>
      </div>
    ) : (
      <div className="space-y-4">
        {bulkSends.map((bulkSend) => (
          <div
            key={bulkSend.batchId}
            className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Bulk Send to {bulkSend.totalRecipients} Recipients
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Batch ID: {bulkSend.batchId}
                  </p>
                  <p className="text-xs text-slate-500">
                    Created {new Date(bulkSend.createdAt).toLocaleDateString()} at{" "}
                    {new Date(bulkSend.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {/* Status Badge */}
              <div>
                {bulkSend.status === "processing" && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing
                  </span>
                )}
                {bulkSend.status === "completed" && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </span>
                )}
                {bulkSend.status === "failed" && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </span>
                )}
              </div>
            </div>
            {/* Progress Stats */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {bulkSend.totalRecipients}
                </div>
                <div className="text-xs text-slate-600 mt-1">Total</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {bulkSend.sentCount}
                </div>
                <div className="text-xs text-green-700 mt-1">Sent</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {bulkSend.pendingCount}
                </div>
                <div className="text-xs text-yellow-700 mt-1">Pending</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {bulkSend.failedCount}
                </div>
                <div className="text-xs text-red-700 mt-1">Failed</div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                  style={{
                    width: `${
                      (bulkSend.sentCount / bulkSend.totalRecipients) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            {/* Failed Recipients */}
            {bulkSend.failedRecipients && bulkSend.failedRecipients.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-2">
                  {bulkSend.failedRecipients.length} Failed Recipients:
                </p>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {bulkSend.failedRecipients.map((failed: any, index: number) => (
                    <div key={index} className="text-xs text-red-800">
                      • {failed.name} ({failed.email}) - {failed.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/bulk-send/${bulkSend.batchId}/details`)
                }
              >
                View Details
              </Button>
              {bulkSend.status === "completed" && (
  <Button
    variant="outline"
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      window.open(`/api/bulk-send/${bulkSend.batchId}/download-all`, '_blank');
    }}
  >
    <Download className="h-4 w-4 mr-1" />
    Download All ({bulkSend.sentCount} PDFs)
  </Button>
)}
              {bulkSend.failedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  onClick={async () => {
                    if (
                      confirm(
                        `Retry sending to ${bulkSend.failedCount} failed recipients?`
                      )
                    ) {
                      try {
                        const res = await fetch(
                          `/api/bulk-send/${bulkSend.batchId}/retry`,
                          {
                            method: "POST",
                            credentials: "include",
                          }
                        );
                        const data = await res.json();
                        if (res.ok && data.success) {
                          alert(`✅ ${data.message}`);
                          fetchBulkSends(); // Refresh list
                        } else {
                          alert(data.message || "Retry failed");
                        }
                      } catch (error) {
                        alert("Failed to retry");
                      }
                    }
                  }}
                >
                  Retry Failed
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</TabsContent>

{/* ARCHIVED TAB */}
<TabsContent value="archived" className="space-y-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">Archived Documents</h3>
      <p className="text-sm text-slate-600">Documents you've archived</p>
    </div>
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        setShowArchived(!showArchived);
        fetchSignatureStats();
      }}
    >
      {showArchived ? 'Hide Archived' : 'Show Archived'}
    </Button>
  </div>

  {!showArchived ? (
    <Card>
      <CardContent className="py-12 text-center">
        <Archive className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">View Archived Documents</h3>
        <p className="text-sm text-slate-600 mb-4">Click "Show Archived" to view your archived documents</p>
        <Button onClick={() => setShowArchived(true)}>
          Show Archived
        </Button>
      </CardContent>
    </Card>
  ) : stats.topDocuments.length === 0 ? (
    <Card>
      <CardContent className="py-12 text-center">
        <Archive className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Archived Documents</h3>
        <p className="text-sm text-slate-600">You haven't archived any documents yet</p>
      </CardContent>
    </Card>
  ) : (
    <div className="grid gap-4">
      {stats.topDocuments.map((doc) => (
        <Card 
          key={doc.id} 
          className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-slate-400"
          onClick={() => {
            setSelectedDocument(doc);
            setShowDocumentDetails(true);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Archive className="h-6 w-6 text-slate-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-slate-900 text-lg truncate">
                      {doc.name}
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Archive className="h-3 w-3 mr-1" />
                      Archived
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">
                        {doc.signedCount} of {doc.totalSigners} signed
                      </span>
                      <span className="font-medium text-slate-600">{doc.completionRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 transition-all"
                        style={{ width: `${doc.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">{doc.signedCount}</span> signed
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{doc.pendingCount}</span> pending
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnarchiveDocument(doc.signers[0]?.uniqueId);
                }}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Restore
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )}
</TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <button 
                onClick={fetchSignatureStats}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'signed' ? 'bg-green-100' :
                        activity.type === 'viewed' ? 'bg-yellow-100' :
                        'bg-purple-100'
                      }`}>
                        {activity.type === 'signed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {activity.type === 'viewed' && <Eye className="h-5 w-5 text-yellow-600" />}
                        {activity.type === 'sent' && <Send className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {activity.documentName}
                        </p>
                        <p className="text-sm text-slate-600">
                          {activity.type === 'signed' && `Signed by ${activity.signerName}`}
                          {activity.type === 'viewed' && `Viewed by ${activity.signerName}`}
                          {activity.type === 'sent' && `Sent to ${activity.signerName}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {activity.signerEmail} • {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">No recent activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

     {/* Document Details Modal */}
<Dialog open={showDocumentDetails} onOpenChange={setShowDocumentDetails}>
  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold flex items-center gap-3">
        <FileText className="h-6 w-6 text-purple-600" />
        {selectedDocument?.name}
      </DialogTitle>
    </DialogHeader>
    {selectedDocument && (
      <div className="space-y-6 mt-4">
        {/* Document Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">Total Signers</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{selectedDocument.totalSigners}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">Signed</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{selectedDocument.signedCount}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-900">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">{selectedDocument.pendingCount}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">Completion</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{selectedDocument.completionRate}%</div>
          </div>
        </div>

        {/* Signers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Signers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedDocument.signers.map((signer) => (
                <div
                  key={signer.email}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(signer.status)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-sm">
                          {signer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{signer.name}</p>
                      <p className="text-sm text-slate-600">{signer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      {getStatusIcon(signer.status)}
                      <span className="capitalize">{signer.status}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSignerDetails(signer);
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Actions */}
        <div className="flex justify-end gap-3">

          {/* Add Archive Button */}
  {!showArchived ? (
    <Button
      variant="outline"
      size="sm"
      className="text-slate-600 hover:bg-slate-50 border-slate-300"
      onClick={() => {
        if (selectedDocument?.signers[0]?.uniqueId) {
          handleArchiveDocument(selectedDocument.signers[0].uniqueId);
        }
      }}
    >
      <Archive className="h-4 w-4 mr-1" />
      Archive
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (selectedDocument?.signers[0]?.uniqueId) {
          handleUnarchiveDocument(selectedDocument.signers[0].uniqueId);
        }
      }}
    >
      <RefreshCw className="h-4 w-4 mr-1" />
      Restore
    </Button>
  )}

  {/* Cancel button */}
  {!showArchived && (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:bg-red-50 border-red-300"
      onClick={() => setShowCancelConfirm(true)}
    >
      <X className="h-4 w-4 mr-1" />
      Cancel
    </Button>
  )}
         
          <button
  onClick={() => {
    console.log('🔍 Selected Document:', selectedDocument);
    console.log('🔍 Signers:', selectedDocument.signers);
    console.log('🔍 First Signer:', selectedDocument.signers[0]);
    
    const firstSigner = selectedDocument.signers[0];
    if (firstSigner && firstSigner.uniqueId) {
      console.log('✅ Using uniqueId:', firstSigner.uniqueId);
      window.open(`/view-signed/${firstSigner.uniqueId}`, '_blank');
    } else {
      console.error('❌ No uniqueId found!', selectedDocument);
      alert('No signers found or missing uniqueId');
    }
  }}
  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
>
  <Eye className="h-4 w-4" />
 View & Download Document
</button>
          <button
            onClick={() => {
    // Use the first signer's uniqueId for the signing link
    const firstSigner = selectedDocument.signers[0];
    if (firstSigner) {
      navigator.clipboard.writeText(
        `${window.location.origin}/sign/${firstSigner.uniqueId}`
      );
      alert('Signing link copied to clipboard!');
    } else {
      alert('No signers found for this document');
    }
  }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            Copy Link
          </button>
          
         <button
  onClick={() => {
    const pendingSigners = selectedDocument.signers.filter(s => s.status !== 'signed');
    if (pendingSigners.length === 0) {
      alert('All signers have already signed!');
      return;
    }
    handleSendReminder(pendingSigners[0].uniqueId);
  }}
  disabled={sendingReminder !== null || selectedDocument.status === 'cancelled'}  // ✅ Add this
  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
>
            {sendingReminder === selectedDocument.id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Reminder
              </>
            )}
          </button>
          {/*  ADD CANCEL BUTTON */}
  {selectedDocument.status !== 'cancelled' && (
  <>
    <Button
      variant="outline"
      size="sm"
      className="text-slate-600 hover:bg-slate-50 border-slate-300"
      onClick={() => handleArchiveDocument(selectedDocument.signers[0].uniqueId)}
    >
      <Archive className="h-4 w-4 mr-1" />
      Archive
    </Button>

    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:bg-red-50 border-red-300"
      onClick={() => setShowCancelConfirm(true)}
    >
      <X className="h-4 w-4 mr-1" />
      Cancel
    </Button>
  </>
)}

{selectedDocument.status === 'cancelled' && (
  <div className="text-red-600 text-sm font-medium">
    This document was cancelled
  </div>
)}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* Signer Details Modal */}
      <Dialog open={showSignerDetails} onOpenChange={setShowSignerDetails}>
        <DialogContent className="max-w-3xl bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              Signer Details: {selectedSigner?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedSigner && (
            <div className="space-y-6">
              {/* Signer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Signer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">Name</p>
                        <p className="font-medium text-slate-900">{selectedSigner.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="font-medium text-slate-900">{selectedSigner.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Status</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedSigner.status)}
                          <span className="capitalize font-medium">{selectedSigner.status}</span>
                        </div>
                      </div>
                      {selectedSigner.signedAt && (
                        <div>
                          <p className="text-sm text-slate-600">Signed At</p>
                          <p className="font-medium text-slate-900">
                            {new Date(selectedSigner.signedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Device & Location */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-purple-600" />
                      Device & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedSigner.device && (
                        <div>
                          <p className="text-sm text-slate-600">Device</p>
                          <p className="font-medium text-slate-900">{selectedSigner.device}</p>
                        </div>
                      )}
                      {selectedSigner.browser && (
                        <div>
                          <p className="text-sm text-slate-600">Browser</p>
                          <p className="font-medium text-slate-900">{selectedSigner.browser}</p>
                        </div>
                      )}
                      {selectedSigner.location && (
                        <div>
                          <p className="text-sm text-slate-600">Location</p>
                          <p className="font-medium text-slate-900">
                            {selectedSigner.location.city}, {selectedSigner.location.country}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Engagement Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-600">Total Views</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedSigner.totalViews || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">Time Spent</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedSigner.totalTimeSpent ? formatTimeSpent(selectedSigner.totalTimeSpent) : '0s'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">Engagement</p>
                      <p className={`text-2xl font-bold ${getEngagementColor(selectedSigner.engagement || 'low')}`}>
                        {selectedSigner.engagement || 'Low'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">Last Active</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedSigner.viewedAt ? formatTimeAgo(selectedSigner.viewedAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSigner.viewedAt && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-yellow-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Document Viewed</p>
                          <p className="text-sm text-slate-600">
                            {new Date(selectedSigner.viewedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedSigner.signedAt && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Document Signed</p>
                          <p className="text-sm text-slate-600">
                            {new Date(selectedSigner.signedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Add this modal to your component */}
<Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
  <DialogContent className="bg-white">
    <DialogHeader>
      <DialogTitle>Cancel Signature Request</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <p>
        Are you sure you want to cancel the signature request for <strong>{selectedDocument?.documentName}</strong>?
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Reason (optional)
        </label>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="w-full p-2 border rounded-lg"
          rows={3}
          placeholder="Enter a reason for cancellation..."
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setShowCancelConfirm(false)}
        >
          Cancel
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
         onClick={async () => {
  if (selectedDocument && selectedDocument.signers.length > 0) {
    await handleCancelRequest(
      selectedDocument.signers[0].uniqueId,  // This value goes to signatureId param
      selectedDocument.name, 
      cancelReason
    );
    setShowCancelConfirm(false);
    setShowDocumentDetails(false);
  } else {
    alert('No signers found for this document');
    setShowCancelConfirm(false);
  }
}}
        >
          Confirm Cancellation
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

    </div>
  );
}