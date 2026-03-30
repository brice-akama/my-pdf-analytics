"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail,
  Activity,
  Book,
  HelpCircle,
  ChevronRight,
  Sparkles,
  CheckCircle,
  X,
} from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  onOpenContact: () => void
  onOpenDemo: () => void
}

const faqs = [
  {
    q: "How do I track who views my documents?",
    a: "Every document you upload automatically tracks views. Go to Documents → Click on any document → View detailed analytics including viewer names, time spent, and pages viewed.",
  },
  {
    q: "How do I send a document for signature?",
    a: "Upload your PDF → Click \"Send for Signature\" → Add recipient emails → Place signature fields on the document → Send. Recipients receive an email with a secure link to sign.",
  },
  {
    q: "Can I customize the branding on shared documents?",
    a: "Yes! Pro and Enterprise plans include custom branding options. You can add your logo, customize colors, and create branded document links.",
  },
  {
    q: "How do I invite team members?",
    a: "Go to Settings → Team → Enter their email address and select their role (Admin, Member, or Viewer) → Send invitation. They'll receive an email to join.",
  },
  {
    q: "What file formats are supported?",
    a: "Currently we support PDF files for document tracking and signatures. We're working on adding support for Word, PowerPoint, and Excel files soon.",
  },
]

export default function HelpDrawer({
  open,
  onClose,
  onOpenContact,
  onOpenDemo,
}: Props) {
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
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[700px] lg:w-[900px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Help & Support
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  We're here to help you succeed
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
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-6">

                {/* Quick Actions Grid */}
                <div className="grid md:grid-cols-2 gap-5">

                  {/* Email Support */}
                  <div
                    onClick={() => { onClose(); onOpenContact() }}
                    className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                        <Mail className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">
                           Email Support
                        </h4>
                        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                          Send us a message and we'll respond within 24 hours
                        </p>
                        <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                          <span>support@docmetrics.io</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book a Demo */}
                  <div
                    onClick={() => { onClose(); onOpenDemo() }}
                    className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                        <Activity className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">
                           Schedule a Demo
                        </h4>
                        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                          Book a personalized walkthrough with our team
                        </p>
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                          <span>Book a Demo</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documentation */}
                  <a
                    href="https://docmetrics-documentation.gitbook.io/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-green-400 hover:bg-green-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                        <Book className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">
                          📚 Documentation
                        </h4>
                        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                          Complete guides and API reference
                        </p>
                        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                          <span>Browse Docs</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </a>

                  {/* Help Center */}
                  <a
                    href="https://docmetrics.io/help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                        <HelpCircle className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">
                           Help Center
                        </h4>
                        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                          FAQs and troubleshooting articles
                        </p>
                        <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                          <span>Get Help</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </a>
                </div>

                {/* FAQs */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-3">
                    {faqs.map((item, index) => (
                      <details
                        key={index}
                        className="group border-2 border-slate-200 rounded-xl p-5 cursor-pointer hover:border-purple-300 transition-colors bg-white"
                      >
                        <summary className="font-semibold text-slate-900 text-base flex items-start gap-3 list-none">
                          <ChevronRight className="h-5 w-5 text-purple-500 transition-transform group-open:rotate-90 flex-shrink-0 mt-0.5" />
                          <span className="flex-1">{item.q}</span>
                        </summary>
                        <p className="text-sm text-slate-600 mt-3 pl-8 leading-relaxed">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>

                {/* Status Notice */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                     
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-12 text-base font-semibold"
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