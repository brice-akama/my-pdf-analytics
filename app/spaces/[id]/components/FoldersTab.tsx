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
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Lock,
  Inbox,
  Activity
} from "lucide-react"

type FolderType = {
  id: string
  name: string
  documentCount: number
  parentId: string | null
  lastUpdated: string
}

export function FoldersTab({
  folders,
  canCreateFolders,
  canManageContacts,
  onOpenFolder,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onManageAccess,
  onRequestFiles,
  onCreateFolder,
  userPlan,
}: {
  folders: FolderType[]
  canCreateFolders: boolean
  canManageContacts: boolean
  onOpenFolder: (folderId: string) => void
  onCreateSubfolder: (folderId: string) => void
  onRenameFolder: (folder: FolderType) => void
  onDeleteFolder: (folder: FolderType) => void
  onManageAccess: (folderId: string) => void
  onRequestFiles: (folder: { id: string; name: string }) => void
  onCreateFolder: () => void
  userPlan: string
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Folders</h2>
          <p className="text-sm text-slate-600 mt-1">
            {folders.length} {folders.length === 1 ? 'folder' : 'folders'} in this space
          </p>
        </div>
        {canCreateFolders && (
          <Button
            onClick={onCreateFolder}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
        )}
      </div>

      {/* Empty State */}
      {folders.length === 0 ? (
        <div className="py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Folder className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No folders yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Create folders to organize your documents and keep everything tidy
          </p>
          {canCreateFolders && (
            <Button
              onClick={onCreateFolder}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Your First Folder
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="lg:hidden divide-y divide-slate-100">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center gap-3 py-3 px-1"
                onClick={() => onOpenFolder(folder.id)}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Folder className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{folder.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {folder.documentCount} {folder.documentCount === 1 ? 'file' : 'files'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{folder.lastUpdated}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenFolder(folder.id) }}>
                      <FolderOpen className="mr-2 h-4 w-4" />Open Folder
                    </DropdownMenuItem>
                    {canCreateFolders && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folder.id) }}>
                        <Plus className="mr-2 h-4 w-4" />Create Subfolder
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRequestFiles({ id: folder.id, name: folder.name }) }}>
                      <Inbox className="mr-2 h-4 w-4" />Request Files
                    </DropdownMenuItem>
                    {canManageContacts && (
  userPlan === 'free' ? (
    <DropdownMenuItem
      disabled
      className="text-slate-300 cursor-not-allowed"
      title="Folder permissions require Starter plan"
    >
      <Lock className="mr-2 h-4 w-4" />
      Manage Access
      <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
        Starter+
      </span>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageAccess(folder.id) }}>
      <Lock className="mr-2 h-4 w-4" />Manage Access
    </DropdownMenuItem>
  )
)}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRenameFolder(folder) }}>
                      <Edit className="mr-2 h-4 w-4" />Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder) }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />Delete Folder
                    </DropdownMenuItem>
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
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Modified</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {folders.map((folder) => (
                <tr
                  key={folder.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onOpenFolder(folder.id)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Folder className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                          {folder.name}
                        </p>
                        <p className="text-xs text-slate-400">Folder</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm text-slate-700 font-medium">{folder.documentCount}</span>
                      <span className="text-sm text-slate-400">{folder.documentCount === 1 ? 'file' : 'files'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-500">{folder.lastUpdated}</span>
                  </td>
                  <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onOpenFolder(folder.id) }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Open
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenFolder(folder.id) }}>
                            <FolderOpen className="mr-2 h-4 w-4" />Open Folder
                          </DropdownMenuItem>
                          {canCreateFolders && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folder.id) }}>
                              <Plus className="mr-2 h-4 w-4" />Create Subfolder
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRequestFiles({ id: folder.id, name: folder.name }) }}>
                            <Inbox className="mr-2 h-4 w-4" />Request Files
                          </DropdownMenuItem>
                          {canManageContacts && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageAccess(folder.id) }}>
                              <Lock className="mr-2 h-4 w-4" />Manage Access
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRenameFolder(folder) }}>
                            <Edit className="mr-2 h-4 w-4" />Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder) }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Delete Folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer stats */}
          <div className="flex items-center gap-6 pt-4 mt-2 border-t border-slate-100 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Folder className="h-4 w-4 text-blue-500" />
              <strong className="text-slate-700">{folders.length}</strong> folders
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-green-500" />
              <strong className="text-slate-700">{folders.reduce((sum, f) => sum + f.documentCount, 0)}</strong> files total
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-purple-500" />
              <strong className="text-slate-700">{folders.filter(f => f.documentCount > 0).length}</strong> active
            </span>
          </div>

          {/* Folder Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{folders.length}</p>
                  <p className="text-sm text-slate-600">Total Folders</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {folders.reduce((sum, f) => sum + f.documentCount, 0)}
                  </p>
                  <p className="text-sm text-slate-600">Files in Folders</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {folders.filter(f => f.documentCount > 0).length}
                  </p>
                  <p className="text-sm text-slate-600">Active Folders</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}