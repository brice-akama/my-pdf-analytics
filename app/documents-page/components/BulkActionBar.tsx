// app/documents-page/components/BulkActionBar.tsx
"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail } from "lucide-react"
import { motion } from "framer-motion"

type Props = {
  count: number
  onSendForSignature: () => void
  onClear: () => void
}

export default function BulkActionBar({ count, onSendForSignature, onClear }: Props) {
  if (count === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-white">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">
            {count} document{count > 1 ? "s" : ""} selected
          </span>
        </div>
        <div className="flex items-center gap-3">
          {count >= 2 && (
            <Button
              onClick={onSendForSignature}
              className="bg-white text-purple-600 hover:bg-slate-100 gap-2 font-semibold"
            >
              <Mail className="h-4 w-4" />
              Send for Signature ({count})
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onClear}
            className="text-white hover:bg-white/20"
          >
            Clear
          </Button>
        </div>
      </div>
    </motion.div>
  )
}