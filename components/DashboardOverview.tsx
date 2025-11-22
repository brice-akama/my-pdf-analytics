// components/DashboardOverview.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, Activity, TrendingUp, Eye, Users, Download, 
  Clock, BarChart3, ArrowUp, ArrowDown, Loader2, Globe,
  MapPin, Monitor, Smartphone, Tablet, Calendar, Filter,
  TrendingDown, Target, Zap, Share2, ChevronRight, Mail, ExternalLink, MousePointer 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Viewer {
  email: string;
  name: string;
  company: string | null;
  firstAccessAt: string;
  lastAccessAt: string;
  totalViews: number;
  totalTimeSpent: number;
  location: {
    city: string;
    country: string;
  } | null;
  engagement: 'high' | 'medium' | 'low';
}

interface Document {
  id: string;
  name: string;
  views: number;
  downloads: number;
  engagement: number;
  viewers: Viewer[];
}


interface DashboardStats {
  totalDocuments: number;
  totalViews: number;
  uniqueViewers: number;
  totalDownloads: number;
  averageEngagement: number;
  averageTimeSpent: number;
  activeShares: number;
  recentActivity: Array<{
    id: string;
    type: 'view' | 'download' | 'share';
    documentName: string;
    timestamp: string;
    viewer?: string;
  }>;
  trending: {
    viewsChange: number;
    downloadsChange: number;
    engagementChange: number;
  };
  // Advanced analytics
  viewsOverTime: Array<{ date: string; views: number; downloads: number }>;
  geographicData: Array<{ country: string; city: string; views: number; lat: number; lng: number }>;
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  topDocuments: Document[];
  hourlyActivity: Array<{ hour: number; views: number }>;
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
  viewerEngagement: Array<{ segment: string; count: number; avgTime: number }>;
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  // Document details modal
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`/api/dashboard/stats?range=${timeRange}`, {
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
      console.error('Dashboard stats error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
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

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-slate-600';
  };const getEngagementColor = (level: 'high' | 'medium' | 'low') => {
  switch(level) {
    case 'high': return 'bg-green-100 text-green-700 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const handleDocumentClick = (doc: Document) => {
  setSelectedDocument(doc);
  setShowDocumentDetails(true);
};



  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-900 font-medium">{error || 'Failed to load dashboard'}</p>
        <button
          onClick={fetchDashboardStats}
          className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-sm text-slate-600 mt-1">Track document performance and viewer engagement</p>
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
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
            <Eye className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalViews.toLocaleString()}</div>
            <p className={`text-sm mt-2 flex items-center gap-1 ${getTrendColor(stats.trending.viewsChange)}`}>
              {getTrendIcon(stats.trending.viewsChange)}
              <span className="font-medium">{Math.abs(stats.trending.viewsChange)}%</span>
              <span className="text-slate-500">vs last period</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Unique Viewers</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.uniqueViewers.toLocaleString()}</div>
            <p className="text-sm text-slate-500 mt-2">
              <span className="font-medium text-green-600">{stats.totalDownloads}</span> downloads
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Engagement</CardTitle>
            <Target className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.averageEngagement}%</div>
            <p className={`text-sm mt-2 flex items-center gap-1 ${getTrendColor(stats.trending.engagementChange)}`}>
              {getTrendIcon(stats.trending.engagementChange)}
              <span className="font-medium">{Math.abs(stats.trending.engagementChange)}%</span>
              <span className="text-slate-500">vs last period</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg. Time</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatTimeSpent(stats.averageTimeSpent)}</div>
            <p className="text-sm text-slate-500 mt-2">per document</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger> 
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Views & Downloads Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Views & Downloads Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.viewsOverTime}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="views" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="downloads" stroke="#10B981" fillOpacity={1} fill="url(#colorDownloads)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Hourly Activity Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Activity by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Bar dataKey="views" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Engagement Funnel
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
          </div>
          

          {/* Top Performing Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Top Performing Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-600 border-b">
                      <th className="pb-3 font-medium">Document</th>
                      <th className="pb-3 font-medium">Views</th>
                      <th className="pb-3 font-medium">Downloads</th>
                      <th className="pb-3 font-medium">Engagement</th>
                      <th className="pb-3 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {stats.topDocuments.map((doc, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 font-medium text-slate-900">{doc.name}</td>
                        <td className="py-3">{doc.views.toLocaleString()}</td>
                        <td className="py-3">{doc.downloads}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                style={{ width: `${doc.engagement}%` }}
                              />
                            </div>
                            <span className="text-xs">{doc.engagement}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            index < 2 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {index < 2 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {index < 2 ? 'Rising' : 'Stable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW DOCUMENTS TAB - PER-DOCUMENT ANALYTICS */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Document Performance</h3>
              <p className="text-sm text-slate-600">Click on any document to see detailed viewer analytics</p>
            </div>
            <div className="text-sm text-slate-600">
              {stats.topDocuments.length} documents
            </div>
          </div>

          {stats.topDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Documents Yet</h3>
                <p className="text-sm text-slate-600">Upload documents and share them to see analytics here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {stats.topDocuments.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500"
                  onClick={() => handleDocumentClick(doc)}
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
                          
                          {/* Stats Row */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span className="font-medium">{doc.views}</span> views
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">{doc.viewers.length}</span> viewers
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              <span className="font-medium">{doc.downloads}</span> downloads
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <span className="font-medium">{doc.engagement}%</span> engagement
                            </div>
                          </div>

                          {/* Viewer Emails Preview */}
                          {doc.viewers.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <div className="flex flex-wrap gap-2">
                                {doc.viewers.slice(0, 3).map((viewer, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                                  >
                                    {viewer.email}
                                  </span>
                                ))}
                                {doc.viewers.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                    +{doc.viewers.length - 3} more
                                  </span>
                                )}
                              </div>
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

        {/* GEOGRAPHY TAB */}
        <TabsContent value="geography" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Geographic Map (Simulated) */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* World Map Visualization (Placeholder - would use real map library) */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-slate-300">
                  <div className="text-center">
                    <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">Interactive World Map</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Geographic visualization showing viewer locations worldwide
                    </p>
                    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {stats.geographicData.slice(0, 6).map((location, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                          <MapPin className="h-5 w-5 text-purple-600 mb-2" />
                          <p className="font-semibold text-slate-900">{location.city}</p>
                          <p className="text-xs text-slate-600">{location.country}</p>
                          <p className="text-lg font-bold text-purple-600 mt-1">{location.views}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Top Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.geographicData.slice(0, 5).map((location, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-900">{location.country}</span>
                          <span className="text-sm text-slate-600">{location.views} views</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            style={{ width: `${(location.views / stats.totalViews) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Cities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Top Cities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.geographicData.slice(0, 8).map((location, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">#{index + 1}</span>
                        <span className="font-medium text-slate-900">{location.city}</span>
                      </div>
                      <span className="text-sm text-slate-600">{location.views} views</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DEVICES TAB */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  Device Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device, percentage }) => `${device}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  {stats.deviceBreakdown.map((device, index) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-slate-700">{device.device}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{device.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Browsers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.browserBreakdown.map((browser, index) => {
                    const percentage = (browser.count / stats.totalViews) * 100;
                    return (
                      <div key={browser.browser}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-700">{browser.browser}</span>
                          <span className="text-slate-600">{browser.count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Viewer Engagement Segments */}
            {stats.viewerEngagement.map((segment, index) => (
              <Card key={segment.segment}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {segment.segment} Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {segment.count}
                  </div>
                  <p className="text-sm text-slate-600">
                    Avg. {formatTimeSpent(segment.avgTime)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All
              </button>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 8).map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'view' ? 'bg-blue-100' :
                        activity.type === 'download' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {activity.type === 'view' && <Eye className="h-5 w-5 text-blue-600" />}
                        {activity.type === 'download' && <Download className="h-5 w-5 text-green-600" />}
                        {activity.type === 'share' && <Share2 className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {activity.documentName}
                        </p>
                        <p className="text-sm text-slate-600">
                          {activity.type === 'view' && 'was viewed'}
                          {activity.type === 'download' && 'was downloaded'}
                          {activity.type === 'share' && 'was shared'}
                          {activity.viewer && ` by ${activity.viewer}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTimeAgo(activity.timestamp)}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Views</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{selectedDocument.views}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-900">Viewers</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{selectedDocument.viewers.length}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">Downloads</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{selectedDocument.downloads}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-900">Engagement</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{selectedDocument.engagement}%</div>
                </div>
              </div>

              {/* Viewers Table */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  All Viewers ({selectedDocument.viewers.length})
                </h3>

                {selectedDocument.viewers.length === 0 ? (
                  <div className="bg-slate-50 rounded-lg p-8 text-center border-2 border-dashed border-slate-200">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">No viewers yet</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Viewer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Location</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">First View</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Last View</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Views</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Time Spent</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Engagement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedDocument.viewers.map((viewer, index) => (
                          <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                  {viewer.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{viewer.email}</p>
                                  {viewer.company && (
                                    <p className="text-xs text-slate-500 truncate">{viewer.company}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {viewer.location ? (
                                <div className="flex items-center gap-1 text-sm text-slate-700">
                                  <MapPin className="h-4 w-4 text-slate-400" />
                                  <span>{viewer.location.city}, {viewer.location.country}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">Unknown</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {formatTimeAgo(viewer.firstAccessAt)}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {formatTimeAgo(viewer.lastAccessAt)}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                                <MousePointer className="h-3.5 w-3.5" />
                                {viewer.totalViews}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-900">
                              {formatTimeSpent(viewer.totalTimeSpent)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEngagementColor(viewer.engagement)}`}>
                                {viewer.engagement.charAt(0).toUpperCase() + viewer.engagement.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}




