// app/nda-records/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  Check,
  Filter,
  Calendar,
  Loader2,
} from 'lucide-react';

interface NdaAcceptance {
  _id: string;
  certificateId: string;
  documentId: string;
  documentTitle: string;
  shareId: string;
  viewerName: string;
  viewerEmail: string;
  viewerCompany?: string;
  timestamp: string;
  ip: string;
  ndaVersion: string;
}

export default function NdaRecordsPage() {
  const router = useRouter();
  
  const [records, setRecords] = useState<NdaAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '7days', '30days', '90days'
  
  useEffect(() => {
    fetchNdaRecords();
  }, [dateFilter]);

  const fetchNdaRecords = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (dateFilter !== 'all') {
        params.set('period', dateFilter);
      }
      
      const res = await fetch(`/api/nda-records?${params}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      }
    } catch (error) {
      console.error('Failed to fetch NDA records:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId: string) => {
    try {
      const res = await fetch(`/api/nda-certificates/${certificateId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NDA-Certificate-${certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const downloadAllCertificates = async () => {
    if (!confirm(`Download ${filteredRecords.length} certificates?`)) return;
    
    for (const record of filteredRecords) {
      await downloadCertificate(record.certificateId);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
    }
  };

  // Filter records by search query
  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.viewerName.toLowerCase().includes(query) ||
      record.viewerEmail.toLowerCase().includes(query) ||
      record.documentTitle.toLowerCase().includes(query) ||
      record.viewerCompany?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  NDA Acceptance Records
                </h1>
                <p className="text-sm text-slate-500">
                  Legal proof of all NDA acceptances
                </p>
              </div>
            </div>
            
            {filteredRecords.length > 0 && (
              <Button
                onClick={downloadAllCertificates}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download All ({filteredRecords.length})
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Filters & Search */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by name, email, document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Acceptances</p>
                <p className="text-2xl font-bold text-slate-900">{records.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Unique Documents</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(records.map(r => r.documentId)).size}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">This Month</p>
                <p className="text-2xl font-bold text-slate-900">
                  {records.filter(r => {
                    const recordDate = new Date(r.timestamp);
                    const now = new Date();
                    return recordDate.getMonth() === now.getMonth() &&
                           recordDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Records Table */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No Results Found' : 'No NDA Acceptances Yet'}
            </h3>
            <p className="text-slate-600">
              {searchQuery 
                ? 'Try adjusting your search filters' 
                : 'NDA acceptance records will appear here when viewers accept your NDAs'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Viewer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Accepted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {record.viewerName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {record.viewerEmail}
                          </p>
                          {record.viewerCompany && (
                            <p className="text-xs text-slate-500">
                              {record.viewerCompany}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {record.documentTitle}
                        </p>
                        <p className="text-xs text-slate-500">
                          {record.ndaVersion}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900">
                          {new Date(record.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(record.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {record.certificateId}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadCertificate(record.certificateId)}
                            className="gap-2"
                          >
                            <Download className="h-3 w-3" />
                            Certificate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/documents/${record.documentId}`)}
                          >
                            View Doc
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}