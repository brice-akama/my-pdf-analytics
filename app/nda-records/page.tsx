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
  CheckCircle2,
  Calendar,
  Loader2,
  ExternalLink,
  Shield,
  Users,
  TrendingUp,
  ChevronDown,
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
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchNdaRecords();
  }, [dateFilter]);

  const fetchNdaRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFilter !== 'all') params.set('period', dateFilter);
      const res = await fetch(`/api/nda-records?${params}`, { credentials: 'include' });
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

  const exportToCSV = () => {
    const headers = [
      'Certificate ID', 'Viewer Name', 'Viewer Email', 'Viewer Company',
      'Document Title', 'Accepted Date', 'Accepted Time', 'IP Address', 'NDA Version',
    ];
    const rows = filteredRecords.map(record => [
      record.certificateId, record.viewerName, record.viewerEmail,
      record.viewerCompany || '', record.documentTitle,
      new Date(record.timestamp).toLocaleDateString('en-US'),
      new Date(record.timestamp).toLocaleTimeString('en-US'),
      record.ip, record.ndaVersion,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDA-Records-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadAllCertificates = async () => {
    if (!confirm(`Download ${filteredRecords.length} certificates? This may take a few minutes.`)) return;

    const progressDiv = document.createElement('div');
    progressDiv.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    progressDiv.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <h3 class="text-base font-semibold text-slate-900 mb-1">Downloading Certificates</h3>
        <p class="text-sm text-slate-500 mb-4">Please don't close this window…</p>
        <div class="flex justify-between text-xs text-slate-500 mb-1.5">
          <span id="progress-text">0 of ${filteredRecords.length}</span>
          <span id="progress-percent">0%</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5">
          <div id="progress-bar" class="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
      </div>
    `;
    document.body.appendChild(progressDiv);

    for (let i = 0; i < filteredRecords.length; i++) {
      try {
        await downloadCertificate(filteredRecords[i].certificateId);
        const progress = ((i + 1) / filteredRecords.length) * 100;
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('progress-text');
        const pct = document.getElementById('progress-percent');
        if (bar) bar.style.width = `${progress}%`;
        if (text) text.textContent = `${i + 1} of ${filteredRecords.length}`;
        if (pct) pct.textContent = `${Math.round(progress)}%`;
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Failed to download certificate ${filteredRecords[i].certificateId}:`, error);
      }
    }

    document.body.removeChild(progressDiv);
    alert(`✅ Successfully downloaded ${filteredRecords.length} certificates!`);
  };

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

  const thisMonthCount = records.filter(r => {
    const d = new Date(r.timestamp);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Left: back + title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-semibold text-slate-900 leading-tight">NDA Acceptance Records</h1>
                  <p className="text-xs text-slate-500">Legal proof of all signed NDAs</p>
                </div>
                <h1 className="sm:hidden text-sm font-semibold text-slate-900">NDA Records</h1>
              </div>
            </div>

            {/* Right: actions (hidden when empty) */}
            {filteredRecords.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs h-8"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </Button>
                <Button
                  onClick={downloadAllCertificates}
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white rounded-xl text-xs h-8"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">All Certificates</span>
                  <span className="sm:hidden">All ({filteredRecords.length})</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Total Acceptances', value: records.length },
            { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Unique Documents', value: new Set(records.map(r => r.documentId)).size },
            { icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', label: 'This Month', value: thisMonthCount },
          ].map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-widest truncate">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by name, email, or document…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm h-9"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9 pr-8 py-2 h-9 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full sm:w-auto"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {searchQuery ? 'No results found' : 'No NDA acceptances yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'NDA acceptance records will appear here when viewers sign your NDAs'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table (md+) ── */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3 text-left">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Viewer</span>
                      </th>
                      <th className="px-5 py-3 text-left">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Document</span>
                      </th>
                      <th className="px-5 py-3 text-left">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Accepted</span>
                      </th>
                      <th className="px-5 py-3 text-left">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Certificate ID</span>
                      </th>
                      <th className="px-5 py-3 text-left">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-900">{record.viewerName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{record.viewerEmail}</p>
                          {record.viewerCompany && (
                            <p className="text-xs text-slate-400 mt-0.5">{record.viewerCompany}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-900 max-w-[200px] truncate">{record.documentTitle}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{record.ndaVersion}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-900">
                            {new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(record.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">
                            {record.certificateId}
                          </code>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadCertificate(record.certificateId)}
                              className="gap-1.5 h-7 text-xs rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              <Download className="h-3 w-3" />
                              Certificate
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/documents/${record.documentId}`)}
                              className="gap-1.5 h-7 text-xs rounded-lg text-slate-500 hover:text-slate-900"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Doc
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile Cards (< md) ── */}
            <div className="md:hidden space-y-3">
              {filteredRecords.map((record) => (
                <div key={record._id} className="bg-white rounded-2xl border border-slate-200 p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{record.viewerName}</p>
                      <p className="text-xs text-slate-500 truncate">{record.viewerEmail}</p>
                      {record.viewerCompany && (
                        <p className="text-xs text-slate-400 truncate">{record.viewerCompany}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(record.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Document */}
                  <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Document</p>
                    <p className="text-sm font-medium text-slate-700 truncate">{record.documentTitle}</p>
                  </div>

                  {/* Certificate ID */}
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Certificate ID</p>
                  <code className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-mono block truncate mb-3">
                    {record.certificateId}
                  </code>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCertificate(record.certificateId)}
                      className="flex-1 gap-1.5 h-8 text-xs rounded-xl border-slate-200 text-slate-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Certificate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/documents/${record.documentId}`)}
                      className="flex-1 gap-1.5 h-8 text-xs rounded-xl text-slate-500 border border-slate-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Doc
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Record count footer */}
            <p className="text-center text-xs text-slate-400 mt-4">
              Showing {filteredRecords.length} of {records.length} records
            </p>
          </>
        )}
      </main>
    </div>
  );
}