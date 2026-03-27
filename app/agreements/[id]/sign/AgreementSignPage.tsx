//app/agreements/[id]/sign/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, FileText, Loader2 } from "lucide-react"

export default function AgreementSignPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const agreementId = params.id as string
  const token = searchParams.get('token')
  
  const [agreement, setAgreement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  
  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    fetchAgreement()
  }, [agreementId, token])

  const fetchAgreement = async () => {
    try {
      const res = await fetch(`/api/agreements/${agreementId}/view?token=${token}`)
      const data = await res.json()
      
      if (res.ok) {
        setAgreement(data.agreement)
      } else {
        alert(data.error || 'Failed to load agreement')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Failed to load agreement')
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async () => {
    if (!signerName.trim()) {
      alert('Please enter your full name')
      return
    }
    
    if (!agreed) {
      alert('Please agree to the terms')
      return
    }

    setSigning(true)

    try {
      const res = await fetch(`/api/agreements/${agreementId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signerName: signerName.trim(),
          signerTitle: signerTitle.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSigned(true)
        alert('Agreement signed successfully!')
      } else {
        alert(data.error || 'Failed to sign agreement')
      }
    } catch (error) {
      console.error('Sign error:', error)
      alert('Failed to sign agreement')
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-12 max-w-2xl text-center">
          <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Successfully Signed!</h1>
          <p className="text-slate-600 mb-8">
            Thank you for signing the agreement. A copy has been sent to your email.
          </p>
          <Button onClick={() => window.close()}>Close Window</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{agreement?.title}</h1>
              <p className="text-sm text-slate-600">Please review and sign</p>
            </div>
          </div>
        </div>

        {/* Agreement Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <iframe
            src={agreement?.filepath}
            className="w-full h-[600px] border rounded-lg"
            title="Agreement Document"
          />
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Sign Agreement</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <Label>Title (optional)</Label>
              <Input
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="CEO"
              />
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="agree" className="text-sm text-slate-700">
                I have read and agree to the terms of this agreement. By signing, I acknowledge that this constitutes a legally binding electronic signature.
              </label>
            </div>
            
            <Button
              onClick={handleSign}
              disabled={signing || !signerName.trim() || !agreed}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {signing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing...
                </>
              ) : (
                'Sign Agreement'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
