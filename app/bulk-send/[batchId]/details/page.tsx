//app/bulk-send/[batchId]/details/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Download,
  ArrowLeft,
  Mail,
  Eye,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Recipient {
  name: string;
  email: string;
  status: string;
  signedAt?: string;
  viewedAt?: string;
  uniqueId: string;
  groupId?: string;
  isGroupSigning?: boolean;
  documentId: string;
  signedPdfUrl: string | null;
  hasSignedCopy: boolean;
}

interface BulkSendDetails {
  batchId: string;
  ownerName: string;
  totalRecipients: number;
  totalDocuments?: number;
  mode?: "individual" | "grouped";
  status: string;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  createdAt: string;
  completedAt?: string;
  message: string;
  recipients: Recipient[];
  groups?: Record<string, Recipient[]>;
  failedRecipients: Array<{
    email: string;
    name: string;
    error: string;
  }>;
}

export default function BulkSendDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  const [details, setDetails] = useState<BulkSendDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "signed" | "pending" | "failed">("all");

  useEffect(() => {
    fetchDetails();
  }, [batchId]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/bulk-send/${batchId}/details`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch details");
      }

      const data = await res.json();
      if (data.success) {
        setDetails(data.bulkSend);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
      setError("Failed to load bulk send details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
  setDownloadingAll(true);
  try {
    // Make sure batchId is properly passed
    if (!batchId) {
      throw new Error("Batch ID is missing");
    }

    // Use fetch with proper headers
    const response = await fetch(`/api/bulk-send/${batchId}/download-all`, {
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to download all documents");
    }

    // Handle the download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_${batchId}_signed_documents.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (err) {
    console.error("Download all error:", err);
    alert(err instanceof Error ? err.message : "Failed to download all documents");
  } finally {
    setDownloadingAll(false);
  }
};



  const handleDownloadSingle = async (uniqueId: string, recipientName: string) => {
    try {
      const link = document.createElement("a");
      link.href = `/api/signature/${uniqueId}/download`;
      link.download = `${recipientName}_signed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download document");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-green-100 text-green-700 border-green-200";
      case "viewed":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "pending":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "awaiting_turn":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-4 w-4" />;
      case "viewed":
        return <Eye className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "awaiting_turn":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Failed to Load Details
            </h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/SignatureDashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRecipients = details.recipients.filter((r) => {
    if (filter === "all") return true;
    if (filter === "signed") return r.status === "signed";
    if (filter === "pending") return r.status === "pending" || r.status === "awaiting_turn";
    return false;
  });

  const signedCount = details.recipients.filter((r) => r.status === "signed").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/SignatureDashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Bulk Send Details
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Batch ID: {details.batchId}
                </p>
              </div>
            </div>
            {signedCount > 0 && (
              <Button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {downloadingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download All Signed ({signedCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Recipients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {details.totalRecipients}
              </div>
              {details.mode === "grouped" && (
                <p className="text-sm text-slate-500 mt-1">
                  {details.totalDocuments} documents
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Signed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {signedCount}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {Math.round((signedCount / details.totalRecipients) * 100)}% complete
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {details.pendingCount}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {details.failedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-600">Overall Progress</span>
              <span className="font-medium text-purple-600">
                {Math.round((signedCount / details.totalRecipients) * 100)}%
              </span>
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                style={{
                  width: `${(signedCount / details.totalRecipients) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 bg-slate-100 rounded-lg p-1 w-fit">
          {["all", "signed", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f} (
              {f === "all"
                ? details.recipients.length
                : f === "signed"
                ? signedCount
                : details.pendingCount}
              )
            </button>
          ))}
        </div>

        {/* Recipients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Recipients ({filteredRecipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRecipients.map((recipient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {recipient.name}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {recipient.email}
                      </p>
                      {recipient.signedAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Signed: {new Date(recipient.signedAt).toLocaleString()}
                        </p>
                      )}
                      {recipient.isGroupSigning && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                          Group Signing
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                        recipient.status
                      )}`}
                    >
                      {getStatusIcon(recipient.status)}
                      {recipient.status}
                    </span>

                    {recipient.status === "signed" && recipient.hasSignedCopy && (
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/signed/${recipient.uniqueId}`, '_blank')}
    >
      <Eye className="h-4 w-4 mr-1" />
      View
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        handleDownloadSingle(recipient.uniqueId, recipient.name)
      }
    >
      <Download className="h-4 w-4 mr-1" />
      Download
    </Button>
  </div>
)}

                    {recipient.status === "signed" && !recipient.hasSignedCopy && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </span>
                    )}
                    {/* Pending - Resend button */}
  {(recipient.status === "pending" || recipient.status === "awaiting_turn") && (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          const res = await fetch(`/api/signature/${recipient.uniqueId}/remind`, {
            method: 'POST',
            credentials: 'include',
          });
          if (res.ok) {
            alert(`✅ Reminder sent to ${recipient.name}`);
          } else {
            alert('❌ Failed to send reminder');
          }
        } catch (err) {
          console.error('Resend error:', err);
          alert('❌ Error sending reminder');
        }
      }}
    >
      <Mail className="h-4 w-4 mr-1" />
      Resend
    </Button>
  )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Failed Recipients */}
        {details.failedRecipients && details.failedRecipients.length > 0 && (
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                Failed Recipients ({details.failedRecipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {details.failedRecipients.map((failed, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="font-medium text-red-900">
                      {failed.name} ({failed.email})
                    </p>
                    <p className="text-sm text-red-700 mt-1">{failed.error}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}