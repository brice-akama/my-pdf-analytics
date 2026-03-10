// app/api/zapier/triggers/signature-completed/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { verifyZapierApiKey } from "@/lib/zapierAuth"

export async function GET(request: NextRequest) {
  const user = await verifyZapierApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await dbPromise

  // Try nda_acceptances first (your actual collection based on session notes)
  const ndaAcceptances = await db.collection("nda_acceptances")
    .find({ documentOwnerId: user.userId })
    .sort({ acceptedAt: -1 })
    .limit(10)
    .toArray()

  if (ndaAcceptances.length > 0) {
    return NextResponse.json(
      ndaAcceptances.map((s: any) => ({
        id: s._id.toString(),
        document_id: s.documentId?.toString() || s.shareId || "",
        document_name: s.documentName || "Agreement",
        document_url: s.documentId
          ? `${process.env.NEXT_PUBLIC_APP_URL}/documents/${s.documentId}`
          : null,
        signer_name: s.signerName || s.name || null,
        signer_email: s.signerEmail || s.email || null,
        signer_company: s.signerCompany || s.company || null,
        certificate_id: s.certificateId || s._id.toString(),
        ip_address: s.ipAddress || s.ip || null,
        signed_at: s.acceptedAt?.toISOString() || s.signedAt?.toISOString() || new Date().toISOString(),
      }))
    )
  }

  // Fallback: signatures collection
  const signatures = await db.collection("signature_requests")
    .find({ documentOwnerId: user.userId, status: "completed" })
    .sort({ completedAt: -1 })
    .limit(10)
    .toArray()

  return NextResponse.json(
    signatures.map((s: any) => ({
      id: s._id.toString(),
      document_id: s.documentId?.toString() || "",
      document_name: s.documentName || "Agreement",
      document_url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${s.documentId}`,
      signer_name: s.signerName || null,
      signer_email: s.signerEmail || null,
      signer_company: s.signerCompany || null,
      certificate_id: s.certificateId || s._id.toString(),
      ip_address: s.ipAddress || null,
      signed_at: s.completedAt?.toISOString() || new Date().toISOString(),
    }))
  )
}