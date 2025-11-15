// components/DashboardOverview.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, Activity, TrendingUp, Eye, Users, Download, 
  Clock, BarChart3, ArrowUp, ArrowDown, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
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
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-5 w-5 bg-slate-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Documents */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Documents
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.totalDocuments}
            </div>
            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
              {stats.activeShares > 0 && (
                <>
                  <span className="font-medium text-blue-600">{stats.activeShares}</span>
                  active shares
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Views
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className={`text-sm mt-2 flex items-center gap-1 ${getTrendColor(stats.trending.viewsChange)}`}>
              {getTrendIcon(stats.trending.viewsChange)}
              <span className="font-medium">
                {Math.abs(stats.trending.viewsChange)}%
              </span>
              <span className="text-slate-500">this week</span>
            </p>
          </CardContent>
        </Card>

        {/* Unique Viewers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Unique Viewers
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.uniqueViewers.toLocaleString()}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {stats.totalDownloads > 0 && (
                <>
                  <span className="font-medium text-green-600">{stats.totalDownloads}</span>
                  {' '}downloads
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Engagement Rate */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Engagement Rate
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.averageEngagement}%
            </div>
            <p className={`text-sm mt-2 flex items-center gap-1 ${getTrendColor(stats.trending.engagementChange)}`}>
              {getTrendIcon(stats.trending.engagementChange)}
              <span className="font-medium">
                {Math.abs(stats.trending.engagementChange)}%
              </span>
              <span className="text-slate-500">this week</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Time Spent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Average Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {formatTimeSpent(stats.averageTimeSpent)}
            </div>
            <p className="text-sm text-slate-600">
              per document view
            </p>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min((stats.averageTimeSpent / 300) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Downloads</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalDownloads}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Shares</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeShares}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg. Views/Doc</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalDocuments > 0 
                    ? Math.round(stats.totalViews / stats.totalDocuments) 
                    : 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Engagement</p>
                <p className="text-2xl font-bold text-slate-900">{stats.averageEngagement}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
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
              {stats.recentActivity.slice(0, 5).map((activity) => (
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
                    {activity.type === 'share' && <Activity className="h-5 w-5 text-purple-600" />}
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
              <p className="text-xs text-slate-500 mt-1">
                Share your first document to see activity here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}