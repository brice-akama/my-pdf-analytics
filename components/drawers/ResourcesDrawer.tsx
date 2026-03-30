"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Book,
  HelpCircle,
  FileText,
  Activity,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
}

export default function ResourcesDrawer({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Resources</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Helpful guides and documentation
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
                <a
                  href="https://docmetrics-documentation.gitbook.io/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
                >
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Book className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 text-lg">
                    Documentation
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Complete guides and API reference
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                    <span>Browse Docs</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </a>

                <a
                  href="https://docmetrics.io/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
                >
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <HelpCircle className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 text-lg">
                    Help Center
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    FAQs and troubleshooting
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                    <span>Get Help</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </a>

                <a
                  href="https://docmetrics.io/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
                >
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 text-lg">Blog</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Tips, updates, and best practices
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                    <span>Read Blog</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </a>

                <a
                  href="https://docmetrics.io/product/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
                >
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 text-lg">
                    Video Tutorials
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Step-by-step video guides
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                    <span>Watch Now</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </a>
              </div>

              
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-white sticky bottom-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-11"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}