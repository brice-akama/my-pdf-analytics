"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  userEmail?: string
}

export default function EarnCreditDialog({ open, onClose, userEmail }: Props) {
  const [referralEmail, setReferralEmail] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)

  const referralSlug = userEmail?.split("@")[0] || "user"
  const referralLink = `docmetrics.com/invite/${referralSlug}`

  const handleInvite = () => {
    if (referralEmail) {
      toast.success(`Invitations sent to: ${referralEmail}`)
      setReferralEmail("")
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-slate-900">
            Get $15* towards any plan for every friend you invite to DocMetrics!
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600 mt-2 text-sm">
            For every friend who signs up for DocMetrics, we'll give you both
            $15* towards any DocMetrics plan when they get their first visit!
          </DialogDescription>
          <p className="text-center text-xs text-slate-500 mt-1">
            *For non-USD currencies, you will receive credit equivalent to 1
            month of DocSend Personal.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Invite by Email */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="add emails (comma separated)"
                className="flex-1 h-10 text-sm"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
              />
              <Button
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-10 font-semibold text-sm"
                onClick={handleInvite}
              >
                INVITE
              </Button>
            </div>

            {/* Referral Link */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <code className="text-xs text-blue-600 font-mono">
                  {referralLink}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={handleCopyLink}
                >
                  {copiedLink ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-blue-600 font-medium text-sm">
                      Copy
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-500">OR</span>
            </div>
          </div>

          {/* Social Share */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-slate-900 text-base">
              Share with your friends on social media
            </h3>
            <p className="text-xs text-slate-500">
              (we'll let you preview the post before it goes out)
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <Button
                className="bg-[#1877F2] hover:bg-[#1565D8] text-white px-6 h-10 font-semibold gap-2 text-sm"
                onClick={() =>
                  window.open(
                    "https://facebook.com/sharer/sharer.php?u=docmetrics.com",
                    "_blank"
                  )
                }
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Share
              </Button>
              <Button
                className="bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white px-6 h-10 font-semibold gap-2 text-sm"
                onClick={() =>
                  window.open(
                    "https://twitter.com/intent/tweet?text=Check out DocMetrics!&url=docmetrics.com",
                    "_blank"
                  )
                }
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Tweet
              </Button>
              <Button
                className="bg-[#0A66C2] hover:bg-[#004182] text-white px-6 h-10 font-semibold gap-2 text-sm"
                onClick={() =>
                  window.open(
                    "https://www.linkedin.com/sharing/share-offsite/?url=docmetrics.com",
                    "_blank"
                  )
                }
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Share
              </Button>
            </div>
          </div>

          {/* Referrals link */}
          <div className="text-center pt-2 border-t border-slate-200">
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm h-8"
              onClick={() => {
                onClose()
                toast.info("Referral tracking feature - coming soon!")
              }}
            >
              Check out the status of your referrals here
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}