// components/GlobalSearch.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  FileText, 
  FolderOpen, 
  Folder,
  FileSignature,
  Inbox,
  User,
  Users,
  Share2,
  FileCheck,
  Loader2,
  X,
  ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const iconMap = {
  FileText,
  FolderOpen,
  Folder,
  FileSignature,
  Inbox,
  User,
  Users,
  Share2,
  FileCheck
}

type SearchResult = {
  id: string
  type: string
  title: string
  subtitle: string
  url: string
  icon: keyof typeof iconMap
  badge: string
  createdAt: string
}

type SearchResults = {
  documents: SearchResult[]
  spaces: SearchResult[]
  folders: SearchResult[]
  agreements: SearchResult[]
  fileRequests: SearchResult[]
  contacts: SearchResult[]
  team: SearchResult[]
  shares: SearchResult[]
  templates: SearchResult[]
  ndaTemplates: SearchResult[]
}

type GlobalSearchProps = {
  isOpen?: boolean
  onClose?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export default function GlobalSearch({ 
  isOpen = false, 
  onClose,
  placeholder = "Search everything...",
  autoFocus = false
}: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Flatten results for keyboard navigation
  const flatResults = results ? [
    ...results.documents,
    ...results.spaces,
    ...results.folders,
    ...results.agreements,
    ...results.fileRequests,
    ...results.contacts,
    ...results.team,
    ...results.shares,
    ...results.templates,
    ...results.ndaTemplates
  ] : []

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults(null)
      setTotalResults(0)
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setResults(data.results)
          setTotalResults(data.totalResults)
          setSelectedIndex(0)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, performSearch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < flatResults.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
          break
        case 'Enter':
          e.preventDefault()
          if (flatResults[selectedIndex]) {
            router.push(flatResults[selectedIndex].url)
            handleClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flatResults, selectedIndex, router])

  // Auto focus
  useEffect(() => {
    if (isOpen && autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, autoFocus])

  const handleClose = () => {
    setQuery('')
    setResults(null)
    setTotalResults(0)
    setSelectedIndex(0)
    onClose?.()
  }

  const handleResultClick = (url: string) => {
    router.push(url)
    handleClose()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago'
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago'
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago'
    return date.toLocaleDateString()
  }

  const renderResultGroup = (
    title: string, 
    items: SearchResult[], 
    startIndex: number
  ) => {
    if (items.length === 0) return null

    return (
      <div className="mb-6 last:mb-0">
        <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0 z-10">
          {title} ({items.length})
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2 py-2">
          {items.map((item, index) => {
            const globalIndex = startIndex + index
            const Icon = iconMap[item.icon] || FileText
            const isSelected = globalIndex === selectedIndex

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                onClick={() => handleResultClick(item.url)}
                className={`p-3 cursor-pointer transition-all rounded-lg ${
                  isSelected 
                    ? 'bg-purple-50 border-2 border-purple-300 shadow-md' 
                    : 'hover:bg-slate-50 border-2 border-transparent hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-purple-100' : 'bg-slate-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isSelected ? 'text-purple-600' : 'text-slate-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-slate-900 truncate text-sm leading-tight">
                        {item.title}
                      </p>
                      {isSelected && (
                        <ArrowRight className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-1 ${
                      isSelected 
                        ? 'bg-purple-200 text-purple-700' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                    <p className="text-xs text-slate-500 truncate mt-1">
                      {item.subtitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTimeAgo(item.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:bg-white text-base"
        />
        {query && !isSearching && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-w-4xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Search Results
                </span>
              </div>
              {totalResults > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                  {totalResults} found
                </span>
              )}
            </div>

            {/* Results - Custom Scrollbar */}
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
              {isSearching ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Searching...</p>
                </div>
              ) : totalResults === 0 ? (
                <div className="py-12 text-center">
                  <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    No results found
                  </p>
                  <p className="text-xs text-slate-500">
                    Try searching for documents, spaces, or contacts
                  </p>
                </div>
              ) : results ? (
                <div className="py-2">
                  {renderResultGroup('Documents', results.documents, 0)}
                  {renderResultGroup('Spaces', results.spaces, results.documents.length)}
                  {renderResultGroup('Folders', results.folders, 
                    results.documents.length + results.spaces.length)}
                  {renderResultGroup('Agreements', results.agreements,
                    results.documents.length + results.spaces.length + results.folders.length)}
                  {renderResultGroup('File Requests', results.fileRequests,
                    results.documents.length + results.spaces.length + results.folders.length + results.agreements.length)}
                  {renderResultGroup('Contacts', results.contacts,
                    results.documents.length + results.spaces.length + results.folders.length + results.agreements.length + results.fileRequests.length)}
                  {renderResultGroup('Team', results.team,
                    results.documents.length + results.spaces.length + results.folders.length + results.agreements.length + results.fileRequests.length + results.contacts.length)}
                  {renderResultGroup('Shared', results.shares,
                    results.documents.length + results.spaces.length + results.folders.length + results.agreements.length + results.fileRequests.length + results.contacts.length + results.team.length)}
                  {renderResultGroup('Templates', results.templates,
                    results.documents.length + results.spaces.length + results.folders.length + results.agreements.length + results.fileRequests.length + results.contacts.length + results.team.length + results.shares.length)}
                  {renderResultGroup('NDA Templates', results.ndaTemplates,
                    results.documents.length + results.spaces.length + results.folders.length + results.agreements.length + results.fileRequests.length + results.contacts.length + results.team.length + results.shares.length + results.templates.length)}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {totalResults > 0 && (
              <div className="px-4 py-3 border-t bg-slate-50 text-xs text-slate-500 flex items-center justify-between sticky bottom-0 z-20">
                <span className="hidden sm:inline">Use ↑↓ to navigate • Enter to open • Esc to close</span>
                <span className="sm:hidden">↑↓ Navigate • Enter Open</span>
                <span className="font-medium text-slate-700">
                  {selectedIndex + 1} of {flatResults.length}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}