"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronRight,
  Calendar,
  Mail,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BulkSend {
  batchId: string;
  documentId: string;
  ownerName: string;
  totalRecipients: number;
  totalDocuments?: number;
  mode?: "individual" | "grouped";
  status: "processing" | "completed" | "failed";
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  createdAt: string;
  completedAt?: string;
  message: string;
  failedRecipients: Array<{
    email: string;
    name: string;
    error: string;
  }>;
}

export default function BulkSendsPage() {
  const router = useRouter();
  const [bulkSends, setBulkSends] = useState<BulkSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "processing" | "failed">("all");

  useEffect(() => {
    fetchBulkSends();
  }, []);

  const fetchBulkSends = async () => {
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
      setLoading(false);
    }
  };

  const filteredBulkSends = bulkSends.filter((bs) => {
    if (filter === "all") return true;
    return bs.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-slate-900">Bulk Sends</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Manage your bulk signature requests
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              {bulkSends.length} total bulk sends
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 bg-slate-100 rounded-lg p-1 w-fit">
          {["all", "completed", "processing", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f} ({bulkSends.filter((bs) => f === "all" || bs.status === f).length})
            </button>
          ))}
        </div>

        {/* Bulk Sends List */}
        {filteredBulkSends.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {filter === "all"
                  ? "No Bulk Sends Yet"
                  : `No ${filter} Bulk Sends`}
              </h3>
              <p className="text-slate-600 mb-6">
                Send documents to multiple recipients at once
              </p>
              <Button onClick={() => router.push("/dashboard")}>
                Browse Documents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBulkSends.map((bulkSend) => (
              <Card
                key={bulkSend.batchId}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  router.push(`/bulk-send/${bulkSend.batchId}/details`)
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 text-lg">
                            Bulk Send to {bulkSend.totalRecipients} Recipients
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                              bulkSend.status
                            )}`}
                          >
                            {getStatusIcon(bulkSend.status)}
                            {bulkSend.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(bulkSend.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Batch ID: {bulkSend.batchId.slice(0, 20)}...
                          </div>
                          {bulkSend.mode && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {bulkSend.mode === "grouped"
                                ? `${bulkSend.totalDocuments} groups`
                                : "Individual"}
                            </div>
                          )}
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">
                              {bulkSend.sentCount} sent, {bulkSend.failedCount} failed
                            </span>
                            <span className="font-medium text-purple-600">
                              {Math.round(
                                (bulkSend.sentCount / bulkSend.totalRecipients) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                              style={{
                                width: `${
                                  (bulkSend.sentCount /
                                    bulkSend.totalRecipients) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3">
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              {bulkSend.sentCount}
                            </span>
                            <span className="text-slate-600">sent</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-600">
                              {bulkSend.pendingCount}
                            </span>
                            <span className="text-slate-600">pending</span>
                          </div>
                          {bulkSend.failedCount > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-600">
                                {bulkSend.failedCount}
                              </span>
                              <span className="text-slate-600">failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
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
      </div>
    </div>
  );
}