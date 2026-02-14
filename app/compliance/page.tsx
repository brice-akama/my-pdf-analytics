"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, FileText, Download, Clock, 
  TrendingDown, Shield, Eye, ArrowLeft 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type ComplianceItem = {
  _id: string;
  documentId?: string;
  filename: string;
  type: 'current' | 'version';
  version: number;
  expiryDate: string;
  expiryReason?: string;
  daysUntilExpiry: number;
  daysExpired?: number;
  createdAt: string;
};

type ComplianceLog = {
  _id: string;
  action: string;
  documentId: string;
  version: number;
  userEmail: string;
  expiryReason?: string;
  timestamp: string;
};

export default function CompliancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalExpired: 0,
    totalExpiringSoon: 0,
    totalActive: 0,
    totalWithExpiry: 0,
  });
  const [expired, setExpired] = useState<ComplianceItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ComplianceItem[]>([]);
  const [active, setActive] = useState<ComplianceItem[]>([]);
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([]);
  const [activeTab, setActiveTab] = useState<'expired' | 'expiring' | 'active' | 'logs'>('expired');

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const res = await fetch('/api/compliance/expired-documents', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setExpired(data.expired);
        setExpiringSoon(data.expiringSoon);
        setActive(data.active);
        setComplianceLogs(data.complianceLogs);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
      toast.error('Failed to load compliance report');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const exportReport = () => {
    const csvRows = [
      ['Type', 'Document', 'Version', 'Status', 'Expiry Date', 'Days Until/Since Expiry', 'Reason']
    ];

    expired.forEach(item => {
      csvRows.push([
        item.type === 'current' ? 'Current Document' : `Version ${item.version}`,
        item.filename,
        item.version.toString(),
        'EXPIRED',
        formatDate(item.expiryDate),
        `Expired ${item.daysExpired} days ago`,
        item.expiryReason || '-'
      ]);
    });

    expiringSoon.forEach(item => {
      csvRows.push([
        item.type === 'current' ? 'Current Document' : `Version ${item.version}`,
        item.filename,
        item.version.toString(),
        'EXPIRING SOON',
        formatDate(item.expiryDate),
        `${item.daysUntilExpiry} days`,
        item.expiryReason || '-'
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Compliance report exported');
  };

  if (loading) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"
        />
        <p className="text-sm sm:text-base text-slate-600 font-medium">Loading compliance report...</p>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
     <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-50 shadow-sm">
  <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-14 sm:h-16">
      {/* Left Side */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard')}
          className="hover:bg-purple-50 flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 text-sm sm:text-base truncate">Compliance Report</h1>
            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Document expiry tracking</p>
          </div>
        </div>
      </div>

      {/* Right Side - Export Button */}
      <Button
        onClick={exportReport}
        size="sm"
        className="gap-1 sm:gap-2 bg-purple-600 hover:bg-purple-700 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4"
      >
        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden xs:inline">Export</span>
        <span className="xs:hidden">CSV</span>
      </Button>
    </div>
  </div>
</header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Expired</h3>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{summary.totalExpired}</p>
            <p className="text-xs text-slate-500 mt-1">Requires immediate action</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Expiring Soon</h3>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{summary.totalExpiringSoon}</p>
            <p className="text-xs text-slate-500 mt-1">Within 30 days</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Active</h3>
              <FileText className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{summary.totalActive}</p>
            <p className="text-xs text-slate-500 mt-1">Valid documents</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Tracked</h3>
              <TrendingDown className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{summary.totalWithExpiry}</p>
            <p className="text-xs text-slate-500 mt-1">With expiry dates</p>
          </motion.div>
        </div>

        {/* Tabs */}
       <div className="bg-white border-b mb-4 sm:mb-6 rounded-t-xl overflow-x-auto">
  <div className="flex gap-4 sm:gap-8 px-3 sm:px-6 min-w-max">
            <button
              onClick={() => setActiveTab('expired')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'expired'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Expired ({summary.totalExpired})
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'expiring'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Expiring Soon ({summary.totalExpiringSoon})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({summary.totalActive})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logs'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Compliance Logs ({complianceLogs.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-xl border border-t-0 shadow-sm">
          {activeTab === 'expired' && (
            <div className="p-6">
              {expired.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
  <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-3 sm:mb-4" />
  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No Expired Documents!</h3>
  <p className="text-sm sm:text-base text-slate-600">All your documents are up to date.</p>
</div>
              ) : (
                <div className="space-y-3">
                  {expired.map((item, index) => (
                   <motion.div
  key={item._id}
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: index * 0.05 }}
  className="border border-red-200 rounded-lg p-3 sm:p-4 bg-red-50 hover:shadow-md transition-shadow"
>
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="px-2 py-0.5 sm:py-1 bg-red-600 text-white text-xs font-bold rounded whitespace-nowrap">
          EXPIRED
        </span>
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base break-all line-clamp-1">{item.filename}</h3>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
  <div>
    <span className="text-slate-600 text-xs">Type:</span>
    <p className="font-medium text-slate-900 truncate">
      {item.type === 'current' ? 'Current' : `Version ${item.version}`}
    </p>
  </div>
                            <div>
                              <span className="text-slate-600">Expired:</span>
                              <p className="font-medium text-red-600">
                                {item.daysExpired} days ago
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-600">Expiry Date:</span>
                              <p className="font-medium text-slate-900">{formatDate(item.expiryDate)}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Reason:</span>
                              <p className="font-medium text-slate-900">{item.expiryReason || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                        <Button
  variant="outline"
  size="sm"
  onClick={() => router.push(`/documents/${item.documentId || item._id}/versions`)}
  className="flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm"
>
  <Eye className="h-3 w-3 sm:h-4 sm:w-6 mr-1 sm:mr-2" />
  View
</Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'expiring' && (
            <div className="p-6">
              {expiringSoon.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Documents Expiring Soon</h3>
                  <p className="text-slate-600">You're all set for the next 30 days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringSoon.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-amber-200 rounded-lg p-4 bg-amber-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded">
                              EXPIRING SOON
                            </span>
                            <h3 className="font-semibold text-slate-900">{item.filename}</h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Type:</span>
                              <p className="font-medium text-slate-900">
                                {item.type === 'current' ? 'Current' : `Version ${item.version}`}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-600">Expires in:</span>
                              <p className="font-medium text-amber-600">
                                {item.daysUntilExpiry} days
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-600">Expiry Date:</span>
                              <p className="font-medium text-slate-900">{formatDate(item.expiryDate)}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Reason:</span>
                              <p className="font-medium text-slate-900">{item.expiryReason || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/documents/${item.documentId || item._id}/versions`)}
                          className="flex-shrink-0"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="p-6">
              {active.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Tracked Documents</h3>
                  <p className="text-slate-600">Set expiry dates to track document validity.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {active.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                              ACTIVE
                            </span>
                            <h3 className="font-semibold text-slate-900">{item.filename}</h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Type:</span>
                              <p className="font-medium text-slate-900">
                                {item.type === 'current' ? 'Current' : `Version ${item.version}`}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-600">Valid for:</span>
                              <p className="font-medium text-green-600">
                                {item.daysUntilExpiry} days
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-600">Expiry Date:</span>
                              <p className="font-medium text-slate-900">{formatDate(item.expiryDate)}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Reason:</span>
                              <p className="font-medium text-slate-900">{item.expiryReason || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/documents/${item.documentId || item._id}/versions`)}
                          className="flex-shrink-0"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-6">
              {complianceLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Violations Logged</h3>
                  <p className="text-slate-600">No attempts to download or sign expired documents.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceLogs.map((log, index) => (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-purple-200 rounded-lg p-4 bg-purple-50"
                    >
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 mb-1">
                            Blocked: {log.action === 'blocked_expired_download' ? 'Download' : 'Signature'} Attempt
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                            <div>
                              <span>User:</span> <strong>{log.userEmail}</strong>
                            </div>
                            <div>
                              <span>Version:</span> <strong>{log.version}</strong>
                            </div>
                            <div>
                              <span>Time:</span> <strong>{formatDate(log.timestamp)}</strong>
                            </div>
                            {log.expiryReason && (
                              <div>
                                <span>Reason:</span> <strong>{log.expiryReason}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}