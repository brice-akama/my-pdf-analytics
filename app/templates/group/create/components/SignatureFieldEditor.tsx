// app/templates/group/create/components/SignatureFieldEditor.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  X,
  Type,
  Calendar,
  CheckSquare,
  Paperclip,
  Edit3,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type SignatureField = {
  id: string
  type: 'signature' | 'date' | 'text' | 'checkbox' | 'attachment'
  x: number
  y: number
  page: number
  width: number
  height: number
  recipientIndex: number
}

type SelectedDocument = {
  documentId: string
  filename: string
  numPages: number
  cloudinaryPdfUrl: string
  signatureFields: SignatureField[]
}

type RecipientRole = {
  index: number
  role: string
  color: string
}

type Props = {
  document: SelectedDocument
  recipientRoles: RecipientRole[]
  onFieldsUpdate: (documentId: string, fields: SignatureField[]) => void
}

export default function SignatureFieldEditor({ document, recipientRoles, onFieldsUpdate }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFieldType, setSelectedFieldType] = useState<'signature' | 'date' | 'text' | 'checkbox' | 'attachment'>('signature')
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  const fieldTypes = [
    { type: 'signature' as const, icon: Edit3, label: 'Signature', width: 140, height: 50 },
    { type: 'date' as const, icon: Calendar, label: 'Date', width: 120, height: 36 },
    { type: 'text' as const, icon: Type, label: 'Text', width: 120, height: 36 },
    { type: 'checkbox' as const, icon: CheckSquare, label: 'Checkbox', width: 24, height: 24 },
    { type: 'attachment' as const, icon: Paperclip, label: 'Attachment', width: 120, height: 36 },
  ]

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
const [pdfLoading, setPdfLoading] = useState(true)
const [pdfError, setPdfError] = useState<string | null>(null)

// Fetch PDF as blob for better rendering
useEffect(() => {
  const fetchPdf = async () => {
    try {
      setPdfLoading(true)
      setPdfError(null)
      
      console.log('🔄 Fetching PDF:', document.cloudinaryPdfUrl);
      
      // Use your API route to get authenticated PDF
      const res = await fetch(`/api/documents/${document.documentId}/file?serve=blob`, {
        credentials: 'include',
      })

      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        throw new Error(`Failed to fetch PDF: ${res.status}`)
      }

      const blob = await res.blob()
      console.log('✅ PDF blob received:', blob.size, 'bytes');
      
      const blobUrl = URL.createObjectURL(blob)
      setPdfBlobUrl(blobUrl)
      console.log('✅ Blob URL created:', blobUrl);
      
    } catch (error) {
      console.error('❌ PDF fetch error:', error)
      setPdfError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setPdfLoading(false)
    }
  }

  fetchPdf()

  // Cleanup
  return () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl)
    }
  }
}, [document.documentId, document.cloudinaryPdfUrl])

 

  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !pdfContainerRef.current) return

    const rect = pdfContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const fieldType = fieldTypes.find(f => f.type === selectedFieldType)
    if (!fieldType) return

    const newField: SignatureField = {
      id: `field-${Date.now()}-${Math.random()}`,
      type: selectedFieldType,
      x: Math.max(0, Math.min(x, 95)),
      y: Math.max(0, Math.min(y, 95)),
      page: currentPage,
      width: fieldType.width,
      height: fieldType.height,
      recipientIndex: selectedRecipientIndex,
    }

    const updatedFields = [...document.signatureFields, newField]
    onFieldsUpdate(document.documentId, updatedFields)
  }

  const handleFieldMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation()
    if (!pdfContainerRef.current) return

    const field = document.signatureFields.find(f => f.id === fieldId)
    if (!field) return

    const rect = pdfContainerRef.current.getBoundingClientRect()
    const fieldX = (field.x / 100) * rect.width
    const fieldY = (field.y / 100) * rect.height

    setDragOffset({
      x: e.clientX - rect.left - fieldX,
      y: e.clientY - rect.top - fieldY,
    })

    setIsDragging(true)
    setDraggedFieldId(fieldId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedFieldId || !pdfContainerRef.current) return

    const rect = pdfContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100

    const updatedFields = document.signatureFields.map(field =>
      field.id === draggedFieldId
        ? { ...field, x: Math.max(0, Math.min(x, 95)), y: Math.max(0, Math.min(y, 95)) }
        : field
    )

    onFieldsUpdate(document.documentId, updatedFields)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedFieldId(null)
  }

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = document.signatureFields.filter(f => f.id !== fieldId)
    onFieldsUpdate(document.documentId, updatedFields)
  }

  const currentPageFields = document.signatureFields.filter(f => f.page === currentPage)

  return (
    <div className="flex flex-col h-full">
      {/* Top Toolbar */}
      <div className="bg-white border-b p-4 space-y-4">
        {/* Field Type Selection */}
       
        {/* Recipient Selection */}
        
        
      </div>

      {/* PDF Viewer with Fields */}
      <div className="flex-1 overflow-auto bg-slate-100 p-4">
        <div className="max-w-5xl mx-auto">
          {/* Page Controls */}
          <div className="bg-white rounded-t-lg border-b p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium text-slate-700">
                Page {currentPage} of {document.numPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(document.numPages, currentPage + 1))}
                disabled={currentPage === document.numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium text-slate-700">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

         {/* PDF Container with Drop Zones */}
<div
  ref={containerRef}
  className="bg-white rounded-b-lg shadow-lg overflow-hidden"
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
>
  <div
    ref={pdfContainerRef}
    className="relative"
    style={{
      transform: `scale(${zoom})`,
      transformOrigin: 'top center',
      transition: 'transform 0.2s',
    }}
  >
    {pdfLoading ? (
      <div className="w-full h-[842px] flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading PDF...</p>
        </div>
      </div>
    ) : pdfError ? (
      <div className="w-full h-[842px] flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 font-semibold">Failed to Load PDF</p>
          <p className="text-sm text-slate-600 mt-2">{pdfError}</p>
        </div>
      </div>
    ) : (
      <div className="space-y-4 p-4">
        {Array.from({ length: document.numPages }, (_, pageIndex) => {
          const pageNum = pageIndex + 1;
          const pageFields = document.signatureFields.filter(f => f.page === pageNum);
          
          return (
            <div
              key={pageNum}
              className="relative bg-white border-2 border-slate-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fieldType = e.dataTransfer.getData("fieldType") as
                  | "signature"
                  | "date"
                  | "text"
                  | "checkbox"
                  | "attachment";

                if (!fieldType) return;

                const container = e.currentTarget;
                const rect = container.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                const fieldSizes = {
                  signature: { width: 140, height: 50 },
                  date: { width: 120, height: 36 },
                  text: { width: 120, height: 36 },
                  checkbox: { width: 24, height: 24 },
                  attachment: { width: 120, height: 36 },
                };

                const newField: SignatureField = {
                  id: `field-${Date.now()}-${Math.random()}`,
                  type: fieldType,
                  x: Math.max(0, Math.min(x, 95)),
                  y: Math.max(0, Math.min(y, 95)),
                  page: pageNum,
                  width: fieldSizes[fieldType].width,
                  height: fieldSizes[fieldType].height,
                  recipientIndex: 0,
                };

                const updatedFields = [...document.signatureFields, newField];
                onFieldsUpdate(document.documentId, updatedFields);
              }}
            >
              {/* Page Number Badge */}
              <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                Page {pageNum}
              </div>

              {/* PDF Page */}
              <iframe
                src={`${pdfBlobUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full border-0 pointer-events-none"
                style={{ height: '842px' }}
                title={`${document.filename} - Page ${pageNum}`}
              />

              {/* Fields Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence>
                  {pageFields.map((field) => {
                    const recipient = recipientRoles[field.recipientIndex];
                    
                    return (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute pointer-events-auto cursor-move group"
                        style={{
                          left: `${field.x}%`,
                          top: `${field.y}%`,
                          width: `${field.width}px`,
                          height: `${field.height}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                      >
                        <div
                          className="w-full h-full border-2 rounded shadow-lg flex items-center justify-center text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: `${recipient?.color}20`,
                            borderColor: recipient?.color,
                            color: recipient?.color,
                          }}
                        >
                          <span className="truncate px-2">
                            {field.type === 'signature' && '✍️ Sign'}
                            {field.type === 'date' && '📅 Date'}
                            {field.type === 'text' && '📝 Text'}
                            {field.type === 'checkbox' && '☑️'}
                            {field.type === 'attachment' && '📎'}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(field.id);
                            }}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        <div
                          className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: recipient?.color }}
                        >
                          {recipient?.role}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>
          

          {/* Field Count */}
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {currentPageFields.length} field(s) on this page
              </span>
              {currentPageFields.length > 0 && (
                <div className="flex gap-2">
                  {recipientRoles.map((role) => {
                    const count = currentPageFields.filter(f => f.recipientIndex === role.index).length
                    if (count === 0) return null
                    
                    return (
                      <span
                        key={role.index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        {role.role}: {count}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}