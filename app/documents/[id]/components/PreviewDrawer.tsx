"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: { filename: string; numPages: number; size: number };
  pdfUrl: string | null;
  isLoadingPage: boolean;
  previewPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  onDownload: () => void;
  isDownloading: boolean;
};

export default function PreviewDrawer({
  open,
  onOpenChange,
  doc,
  pdfUrl,
  isLoadingPage,
  previewPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onDownload,
  isDownloading,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <motion.div className="h-[100vh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg"
              >
                <FileText className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">{doc.filename}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {doc.numPages} pages • {(doc.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDownload}
                  disabled={isDownloading}
                  className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
                >
                  {isDownloading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden p-8 flex items-center justify-center bg-slate-900">
          <AnimatePresence mode="wait">
            {isLoadingPage ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-slate-300 font-medium">Loading page {previewPage}...</p>
              </motion.div>
            ) : pdfUrl ? (
              <motion.div
                key="pdf"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  title="PDF Preview"
                />
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Failed to load preview</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {pdfUrl && !isLoadingPage && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-2xl border border-slate-700/50">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrevPage}
                  disabled={previewPage <= 1}
                  className="text-white hover:bg-slate-700/50 disabled:opacity-30 rounded-xl h-10 w-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </motion.div>
              <div className="flex items-center gap-3 px-4">
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={previewPage}
                  onChange={(e) => { const p = parseInt(e.target.value); if (p) onGoToPage(p); }}
                  className="w-16 bg-slate-800 text-white text-center rounded-xl px-3 py-2 text-sm font-medium border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all"
                />
                <span className="text-white font-medium">/ {totalPages}</span>
              </div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNextPage}
                  disabled={previewPage >= totalPages}
                  className="text-white hover:bg-slate-700/50 disabled:opacity-30 rounded-xl h-10 w-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Drawer>
  );
}