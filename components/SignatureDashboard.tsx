// components/SignatureDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, Clock, Users, CheckCircle, Eye, AlertCircle,
  Download, Mail, MapPin, Monitor, Smartphone, Tablet,
  Calendar, TrendingUp, Loader2, Send, RefreshCw, ExternalLink,
  ChevronRight, Globe, Target, Activity, MousePointer
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
}

interface SignatureStats {
  totalRequests: number;
  pendingRequests: number;
  viewedRequests: number;
  signedRequests: number;
  uniqueSigners: number;
  avgTimeToSign: number;
  completionRate: number;
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
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function SignatureDashboard() {
  const [stats, setStats] = useState<SignatureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [selectedDocument, setSelectedDocument] = useState<SignatureDocument | null>(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState<Signer | null>(null);
  const [showSignerDetails, setShowSignerDetails] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    fetchSignatureStats();
    const interval = setInterval(fetchSignatureStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchSignatureStats = async () => {
    try {
      const res = await fetch(`/api/dashboard/signature-stats?range=${timeRange}`, {
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
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
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
    // Send reminder to all pending signers
    const pendingSigners = selectedDocument.signers.filter(s => s.status !== 'signed');
    if (pendingSigners.length === 0) {
      alert('All signers have already signed!');
      return;
    }
    
    // Send to first pending signer (or you can send to all)
    handleSendReminder(pendingSigners[0].uniqueId);
  }}
  disabled={sendingReminder !== null}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
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
    </div>
  );
}
