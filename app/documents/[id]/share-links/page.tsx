// app/documents/[id]/share-links/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Plus,
  Link2,
  Eye,
  Download,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Lock,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareLink {
  id: string;
  shareLink: string;
  shareToken: string;
  active: boolean;
  settings: {
    requireEmail: boolean;
    allowDownload: boolean;
    allowPrint: boolean;
    hasPassword: boolean;
    maxViews: number | null;
    allowedEmails: number;
  };
  tracking: {
    views: number;
    uniqueViewers: number;
    downloads: number;
    prints: number;
    lastViewedAt: string | null;
  };
  expiresAt: string | null;
  expired: boolean;
  maxViewsReached: boolean;
  createdAt: string;
}

interface Document {
  id: string;
  filename: string;
  numPages: number;
}

export default function ShareLinksPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocument();
    fetchShareLinks();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDocument({
          id: data.document._id,
          filename: data.document.originalFilename,
          numPages: data.document.numPages,
        });
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
    }
  };

  const fetchShareLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/share`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setShareLinks(data.shares);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (link: string, linkId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shareId: linkId,
          active: !currentStatus,
        }),
      });

      if (res.ok) {
        fetchShareLinks();
      }
    } catch (error) {
      console.error('Failed to toggle link status:', error);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('Delete this share link? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${documentId}/share?shareId=${linkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        alert('✅ Share link deleted');
        fetchShareLinks();
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

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
                onClick={() => router.push(`/documents/${documentId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Share Links
                </h1>
                <p className="text-sm text-slate-500">
                  {document?.filename}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4" />
              Create New Link
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Multiple Share Links</p>
              <p>
                Create different share links for the same document with unique settings. 
                Track analytics separately for each link.
              </p>
            </div>
          </div>
        </div>

        {/* Share Links List */}
        {shareLinks.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <Link2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Share Links Yet
            </h3>
            <p className="text-slate-600 mb-6">
              Create your first share link to start sharing this document securely
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4" />
              Create First Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {shareLinks.map((link) => (
              <div
                key={link.id}
                className={`bg-white rounded-xl border shadow-sm p-6 ${
                  !link.active || link.expired || link.maxViewsReached
                    ? 'opacity-60'
                    : ''
                }`}
              >
                {/* Link Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Status Badges */}
                    <div className="flex items-center gap-2 mb-2">
                      {link.active && !link.expired && !link.maxViewsReached ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {link.expired ? 'Expired' : link.maxViewsReached ? 'Limit Reached' : 'Inactive'}
                        </span>
                      )}
                      
                      {link.settings.hasPassword && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          <Lock className="h-3 w-3 mr-1" />
                          Password
                        </span>
                      )}
                      
                      {link.settings.allowedEmails > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          <Users className="h-3 w-3 mr-1" />
                          {link.settings.allowedEmails} Recipients
                        </span>
                      )}
                    </div>

                    {/* Share Link */}
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={link.shareLink}
                        readOnly
                        className="flex-1 font-mono text-sm bg-slate-50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.shareLink, link.id)}
                        className="gap-2 flex-shrink-0"
                      >
                        {copiedLinkId === link.id ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                      {link.expiresAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      {link.settings.maxViews && (
                        <>
                          <span>•</span>
                          <span>Max Views: {link.settings.maxViews}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(link.shareLink, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleLinkStatus(link.id, link.active)}
                      >
                        {link.active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteLink(link.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Analytics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-600">Views</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">
                      {link.tracking.views}
                    </p>
                    <p className="text-xs text-slate-500">
                      {link.tracking.uniqueViewers} unique
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-600">Downloads</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">
                      {link.tracking.downloads}
                    </p>
                    {!link.settings.allowDownload && (
                      <p className="text-xs text-red-500">Disabled</p>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-600">Prints</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">
                      {link.tracking.prints}
                    </p>
                    {!link.settings.allowPrint && (
                      <p className="text-xs text-red-500">Disabled</p>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-600">Last View</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {link.tracking.lastViewedAt
                        ? new Date(link.tracking.lastViewedAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Settings Summary */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-slate-700 mb-2">Settings:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                      {link.settings.requireEmail ? '✓ Email Required' : '✗ No Email'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                      {link.settings.allowDownload ? '✓ Download' : '✗ No Download'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                      {link.settings.allowPrint ? '✓ Print' : '✗ No Print'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Link Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Create New Share Link</DialogTitle>
            <DialogDescription>
              This will redirect you to configure a new share link with custom settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              onClick={() => {
                setShowCreateDialog(false);
                router.push(`/documents-page`); // Redirect to main share flow
              }}
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4" />
              Configure Share Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}