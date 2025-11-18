// components/ViewerInsights.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Mail, Building, MapPin, Clock, Eye, Download,
  Calendar, TrendingUp, Activity, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Viewer {
  email: string;
  name: string | null;
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

export default function ViewerInsights({ documentId }: { documentId: string }) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchViewers();
  }, [documentId]);

  const fetchViewers = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/viewers`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setViewers(data.viewers || []);
      }
    } catch (error) {
      console.error('Failed to fetch viewers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredViewers = viewers.filter(viewer =>
    viewer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    viewer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    viewer.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading viewer insights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            Viewer Insights
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            See everyone who viewed this document
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-900">{viewers.length}</p>
          <p className="text-sm text-slate-600">Total Viewers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search viewers by email, name, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Viewer List */}
      {filteredViewers.length > 0 ? (
        <div className="grid gap-4">
          {filteredViewers.map((viewer, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left: Viewer Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {viewer.name ? viewer.name.charAt(0).toUpperCase() : viewer.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {viewer.name || 'Anonymous'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-3 w-3" />
                          {viewer.email}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {viewer.company && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building className="h-4 w-4 text-purple-600" />
                          <span>{viewer.company}</span>
                        </div>
                      )}
                      
                      {viewer.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span>{viewer.location.city}, {viewer.location.country}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Eye className="h-4 w-4 text-green-600" />
                        <span>{viewer.totalViews} views</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span>{formatDuration(viewer.totalTimeSpent)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="ml-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getEngagementColor(viewer.engagement)}`}>
                      {viewer.engagement === 'high' && <TrendingUp className="h-3 w-3" />}
                      {viewer.engagement === 'medium' && <Activity className="h-3 w-3" />}
                      {viewer.engagement.toUpperCase()} ENGAGEMENT
                    </span>
                    
                    <div className="mt-3 text-xs text-slate-500">
                      <p className="flex items-center justify-end gap-1">
                        <Calendar className="h-3 w-3" />
                        First: {formatTimeAgo(viewer.firstAccessAt)}
                      </p>
                      <p className="flex items-center justify-end gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Last: {formatTimeAgo(viewer.lastAccessAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No viewers found matching "{searchQuery}"</p>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No one has viewed this document yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  Share your document to start tracking viewers
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}