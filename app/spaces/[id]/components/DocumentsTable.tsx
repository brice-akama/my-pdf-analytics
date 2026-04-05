"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Eye,
  Download,
  Lock,
  Edit,
  Trash2,
  MoreVertical,
  Folder,
  Home,
  FileSignature,
  Activity,
  Clock,
  Share2,
  Upload,
  Package
} from "lucide-react"
import { useRouter } from "next/navigation"

type DocumentType = {
  id: string
  name: string
  type: string
  size: string
  views: number
  expiresAt?: string | null
  originalFilename: string
  downloads: number
  lastUpdated: string
  folderId: string | null
  folder: string
  cloudinaryPdfUrl: string
  canDownload?: boolean
  signatureRequestId?: string | null
  signatureStatus?:
    | 'draft' | 'sent' | 'viewed' | 'signed'
    | 'declined' | 'expired' | 'pending'
    | 'completed' | null | undefined
}

type FolderType = {
  id: string
  name: string
  documentCount: number
  parentId: string | null
  lastUpdated: string
}

export function DocumentsTable({
  spaceId,
  documents,
  folders,
  selectedFolder,
  showUnfiledOnly,
  canUpload,
  canEdit,
  canDelete,
  canManageContacts,
  canShareSpace,
  selectAll,
  selectedDocs,
  onSelectAll,
  onSelectDoc,
  onOpenPdf,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onSetExpiry,
  onManageAccess,
  onShare,
  onToggleUnfiled,
  onViewFolders,
  onUpload,
  onFolderClick,
}: {
  spaceId: string
  documents: DocumentType[]
  folders: FolderType[]
  selectedFolder: string | null
  showUnfiledOnly: boolean
  canUpload: boolean
  canEdit: boolean
  canDelete: boolean
  canManageContacts: boolean
  canShareSpace: boolean
  selectAll: boolean
  selectedDocs: string[]
  onSelectAll: () => void
  onSelectDoc: (docId: string) => void
  onOpenPdf: (doc: DocumentType) => void
  onDownload: (doc: DocumentType) => void
  onRename: (doc: DocumentType) => void
  onMove: (doc: DocumentType) => void
  onDelete: (fileId: string, filename: string) => void
  onSetExpiry: (doc: DocumentType) => void
  onManageAccess: (doc: DocumentType) => void
  onShare: () => void
  onToggleUnfiled: () => void
  onViewFolders: () => void
  onUpload: () => void
  onFolderClick: (folderId: string) => void
}) {
  const router = useRouter()

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <Upload className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h3>
        <p className="text-slate-600 mb-6">Upload documents to get started</p>
        {canUpload && (
          <Button
            onClick={onUpload}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Documents</h2>
        <div className="flex flex-wrap gap-2">
          {canShareSpace && (
            <Button
              onClick={onShare}
              variant="outline"
              className="gap-2 bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200 hover:text-sky-800 hover:border-sky-400 flex-1 sm:flex-none justify-center"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
          <Button
            variant={showUnfiledOnly ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleUnfiled}
            className="gap-2 flex-1 sm:flex-none justify-center"
          >
            <FileText className="h-4 w-4" />
            {showUnfiledOnly ? 'Show All' : 'Unfiled Only'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewFolders}
            className="gap-2 flex-1 sm:flex-none justify-center"
          >
            <Folder className="h-4 w-4" />
            View All Folders
          </Button>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden divide-y divide-slate-100">
        {documents
          .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
          .slice(0, 10)
          .map((doc) => (
            <div key={`mobile-doc-${doc.id}`} className="flex items-center gap-3 py-3 px-1">
              <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {doc.folder ? (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {folders.find(f => f.id === doc.folder)?.name || 'Folder'}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Unfiled</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Eye className="h-3 w-3" />{doc.views}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Download className="h-3 w-3" />{doc.downloads}</span>
                  {doc.signatureRequestId && (
                    <span className={`text-xs font-medium ${doc.signatureStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {doc.signatureStatus === 'completed' ? '✅ Signed' : '🖊️ Pending'}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  <DropdownMenuItem onClick={() => onOpenPdf(doc)}>
                    <Eye className="mr-2 h-4 w-4" />View
                  </DropdownMenuItem>
                  {doc.canDownload !== false ? (
                    <DropdownMenuItem onClick={() => onDownload(doc)}>
                      <Download className="mr-2 h-4 w-4" />Download
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled className="text-slate-400">
                      <Lock className="mr-2 h-4 w-4" />Restricted
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}/signature?mode=send&returnTo=/spaces/${spaceId}`)}>
                        <FileSignature className="mr-2 h-4 w-4" />Send for Signature
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRename(doc)}>
                        <Edit className="mr-2 h-4 w-4" />Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMove(doc)}>
                        <Activity className="mr-2 h-4 w-4" />Move to Folder
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => onDelete(doc.id, doc.name)}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
      </div>

      {/* Desktop */}
      <table className="w-full hidden lg:table">
        <thead className="border-b border-slate-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
              <input type="checkbox" className="rounded" checked={selectAll} onChange={onSelectAll} />
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Folder</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Activity</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last updated</th>
            <th className="text-right px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
            .slice(0, 10)
            .map((doc) => (
              <tr key={`desktop-doc-${doc.id}`} className="hover:bg-slate-50">
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedDocs.includes(doc.id)}
                    onChange={() => onSelectDoc(doc.id)}
                    disabled={doc.signatureStatus === 'completed'}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="font-medium text-slate-900">{doc.name}</span>
                    {doc.signatureRequestId && (
                      <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        doc.signatureStatus === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : doc.signatureStatus === 'declined'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {doc.signatureStatus === 'completed' && '✅ Signed'}
                        {doc.signatureStatus === 'pending' && '🖊️ Awaiting Signature'}
                        {doc.signatureStatus === 'declined' && '❌ Declined'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {doc.folder ? (
                    <button
                      onClick={() => onFolderClick(doc.folder)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-sm text-blue-700"
                    >
                      <Folder className="h-3 w-3" />
                      <span>{folders.find(f => f.id === doc.folder)?.name || 'Unknown'}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-sm text-slate-600">
                      <Home className="h-3 w-3" />
                      <span>Unfiled</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{doc.views}</span>
                    <span className="flex items-center gap-1"><Download className="h-3 w-3" />{doc.downloads}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{doc.lastUpdated}</span>
                </td>
                <td className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white">
                      <DropdownMenuItem onClick={() => onOpenPdf(doc)}>
                        <Eye className="mr-2 h-4 w-4" />View
                      </DropdownMenuItem>
                      {doc.canDownload !== false ? (
                        <DropdownMenuItem onClick={() => onDownload(doc)}>
                          <Download className="mr-2 h-4 w-4" />Download
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled className="text-slate-400">
                          <Lock className="mr-2 h-4 w-4" />Download Restricted
                        </DropdownMenuItem>
                      )}
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}/signature?mode=send&returnTo=/spaces/${spaceId}`)}>
                            <FileSignature className="mr-2 h-4 w-4" />Send for Signature
                          </DropdownMenuItem>
                        </>
                      )}
                      {canManageContacts && (
                        <DropdownMenuItem onClick={() => onManageAccess(doc)}>
                          <Lock className="mr-2 h-4 w-4" />Manage Access
                        </DropdownMenuItem>
                      )}
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onRename(doc)}>
                            <Edit className="mr-2 h-4 w-4" />Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSetExpiry(doc)}>
                            <Clock className="mr-2 h-4 w-4" />
                            {doc.expiresAt ? 'Change Expiry' : 'Set Expiry'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onMove(doc)}>
                            <Activity className="mr-2 h-4 w-4" />Move to Folder
                          </DropdownMenuItem>
                        </>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(doc.id, doc.name)}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Floating Action Bar */}
      {selectedDocs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-6 border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                {selectedDocs.length}
              </div>
              <span className="font-medium">
                {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              {selectedDocs.length === 1 ? (
                <Button
                  onClick={() => router.push(`/documents/${selectedDocs[0]}/signature?mode=send&returnTo=/spaces/${spaceId}`)}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <FileSignature className="h-4 w-4" />
                  Send for Signature
                </Button>
              ) : (
                <Button
                  onClick={() => router.push(`/documents/envelope/create?docs=${selectedDocs.join(',')}&spaceId=${spaceId}`)}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <Package className="h-4 w-4" />
                  Bundle & Send for Signatures ({selectedDocs.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}