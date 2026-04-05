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
  Trash2,
  FileText,
  Eye,
  Download,
  Lock,
  Edit,
  Activity,
  FileSignature,
  MoreVertical,
  Folder
} from "lucide-react"
import { toast } from "sonner"

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

export function TrashTab({
  spaceId,
  trashedDocuments,
  folders,
  canEdit,
  canDelete,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onOpenPdf,
  onRename,
  onMove,
  onDeleteFile,
  router,
}: {
  spaceId: string
  trashedDocuments: DocumentType[]
  folders: FolderType[]
  canEdit: boolean
  canDelete: boolean
  onRestore: (fileId: string) => void
  onPermanentDelete: (fileId: string) => void
  onEmptyTrash: () => void
  onOpenPdf: (doc: DocumentType) => void
  onRename: (doc: DocumentType) => void
  onMove: (doc: DocumentType) => void
  onDeleteFile: (fileId: string, filename: string) => void
  router: any
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trash</h2>
          <p className="text-sm text-slate-600 mt-1">
            {trashedDocuments.length} deleted {trashedDocuments.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        {trashedDocuments.length > 0 && (
          <Button variant="destructive" onClick={onEmptyTrash}>
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Trash
          </Button>
        )}
      </div>

      {trashedDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <Trash2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Trash is empty</h3>
          <p className="text-slate-600">Deleted files will appear here</p>
        </div>
      ) : (
        <div className="overflow-hidden">

          {/* Mobile */}
          <div className="lg:hidden divide-y divide-slate-100">
            {trashedDocuments.map((doc) => (
              <div key={`mobile-trash-${doc.id}`} className="flex items-center gap-3 py-3 px-1">
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
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{doc.lastUpdated}</span>
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
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => onRestore(doc.id)}>
                    <Activity className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onPermanentDelete(doc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <table className="w-full hidden lg:table">
            <thead className="border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Folder</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Last updated</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trashedDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="font-medium text-slate-900">{doc.name}</span>
                      {doc.signatureRequestId && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.signatureStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : doc.signatureStatus === 'declined'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.signatureStatus === 'completed' && 'Signed'}
                          {doc.signatureStatus === 'pending' && 'Awaiting Signature'}
                          {doc.signatureStatus === 'declined' && 'Declined'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {doc.folder ? folders.find(f => f.id === doc.folder)?.name : 'Root'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{doc.lastUpdated}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(doc.id)}
                        className="gap-2"
                      >
                        <Activity className="h-4 w-4" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onPermanentDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}