// app/api/cc/[uniqueId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const email = request.nextUrl.searchParams.get("email");

    console.log('🔍 Fetching CC data for:', uniqueId, email);

    const db = await dbPromise;

    const ccRecord = await db.collection("cc_recipients").findOne({
      uniqueId: uniqueId,
      email: email,
    });

    if (!ccRecord) {
      return NextResponse.json(
        { success: false, message: "CC record not found" },
        { status: 404 }
      );
    }

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(ccRecord.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    const signatureRequests = await db
      .collection("signature_requests")
      .find({
        documentId: ccRecord.documentId,
        ...(ccRecord.batchId ? { batchId: ccRecord.batchId } : {}),
      })
      .toArray();

    console.log('📋 Found', signatureRequests.length, 'signature requests');

    const signedCount = signatureRequests.filter(
      r => r.status === 'signed' || r.status === 'completed'
    ).length;
    const allSigned = signedCount === signatureRequests.length && signatureRequests.length > 0;
    const status = allSigned ? "Completed" : `${signedCount}/${signatureRequests.length} Signed`;

    // ── Build per-recipient signature maps ──────────────────────────────────
    // Each recipient gets their own signatures map so the frontend can
    // switch the PDF overlay when the user clicks a different signer.
    const recipients = signatureRequests.map((req, index) => {
      const isSigned = req.status === 'signed' || req.status === 'completed';
      const signaturesForRecipient: Record<string, any> = {};

      // Isolated mode: each request only has its own signedFields
      if (req.signedFields && isSigned) {
        req.signedFields.forEach((field: any) => {
          let signatureData: string | null = null;

          if (field.type === 'signature') {
            signatureData = field.signatureData || field.data || field.value;
          } else if (field.type === 'date') {
            signatureData = field.dateValue || field.data || field.value;
          } else if (field.type === 'text') {
            signatureData = field.textValue || field.data || field.value;
          } else if (field.type === 'checkbox') {
            signatureData = field.checkboxValue !== undefined
              ? String(field.checkboxValue)
              : (field.data || field.value);
          }

          if (signatureData) {
            signaturesForRecipient[field.id] = {
              type: field.type,
              data: signatureData,
              timestamp: field.timestamp || req.signedAt,
              recipientName: req.recipient?.name,
              recipientEmail: req.recipient?.email,
            };
          }
        });
      }

      // Shared mode: sharedSignatures keyed by recipientIndex
      if (req.sharedSignatures) {
        Object.entries(req.sharedSignatures).forEach(([, sharedSig]: [string, any]) => {
          if (sharedSig.signedFields) {
            sharedSig.signedFields.forEach((field: any) => {
              let signatureData: string | null = null;

              if (field.type === 'signature') {
                signatureData = field.signatureData || field.data || field.value;
              } else if (field.type === 'date') {
                signatureData = field.dateValue || field.data || field.value;
              } else if (field.type === 'text') {
                signatureData = field.textValue || field.data || field.value;
              } else if (field.type === 'checkbox') {
                signatureData = field.checkboxValue !== undefined
                  ? String(field.checkboxValue)
                  : (field.data || field.value);
              }

              if (signatureData && !signaturesForRecipient[field.id]) {
                signaturesForRecipient[field.id] = {
                  type: field.type,
                  data: signatureData,
                  timestamp: field.timestamp || sharedSig.signedAt,
                  recipientName: sharedSig.recipientName,
                  recipientEmail: sharedSig.recipientEmail,
                };
              }
            });
          }
        });
      }

      return {
        index,
        name: req.recipient?.name,
        email: req.recipient?.email,
        status: isSigned ? 'completed' : req.status,
        signatureFields: req.signatureFields || [],   // fields assigned to THIS recipient
        signatures: signaturesForRecipient,           // ← per-recipient map
      };
    });

    // ── Also build a merged "all signatures" view for backward compat ───────
    const allSignatures: Record<string, any> = {};
    recipients.forEach(r => {
      Object.assign(allSignatures, r.signatures);
    });

    // Use the first request's signatureFields as the shared field layout
    const signatureFields = signatureRequests.length > 0
      ? signatureRequests[0].signatureFields
      : [];

    return NextResponse.json({
      success: true,
      documentId: ccRecord.documentId,
      documentName: document.filename || "Document",
      numPages: document.numPages || 1,
      senderName: ccRecord.ownerEmail,
      ccName: ccRecord.name,
      ccEmail: ccRecord.email,
      notifyWhen: ccRecord.notifyWhen,
      createdAt: ccRecord.createdAt,
      status,
      signatureFields,          // shared layout (all fields across all recipients)
      signatures: allSignatures, // merged — used as default view (all signers)
      recipients,               // ← now includes per-recipient signatures + fields
    });

  } catch (error) {
    console.error("❌ Error fetching CC data:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}