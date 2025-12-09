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

    // Get document info
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(ccRecord.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Get ALL signature requests for this document
    const signatureRequests = await db
      .collection("signature_requests")
      .find({ documentId: ccRecord.documentId })
      .toArray();

    console.log('📋 Found', signatureRequests.length, 'signature requests');

    const allSigned = signatureRequests.every((req) => req.status === "signed" || req.status === "completed");
    const status = allSigned ? "Completed" : "Pending Signatures";

    // Get signature fields from first request (they're all the same in shared mode)
    const signatureFields = signatureRequests.length > 0 
      ? signatureRequests[0].signatureFields 
      : [];

    console.log('📋 Signature fields:', signatureFields.length);

    // ⭐ FIXED: Collect all signatures from all signers
    const allSignatures: Record<string, any> = {};
    
    signatureRequests.forEach((req, index) => {
      console.log(`\n👤 Checking recipient ${index + 1}:`, req.recipient?.name);
      console.log('   Status:', req.status);
      console.log('   Has signedFields:', !!req.signedFields);
      
      if (req.signedFields && (req.status === 'signed' || req.status === 'completed')) {
        console.log('   ✅ Processing', req.signedFields.length, 'signed fields');
        
        req.signedFields.forEach((field: any) => {
          console.log('   📝 Field:', field.id, 'Type:', field.type);
          
          // ⭐ CRITICAL FIX: Handle different possible property names
          let signatureData = null;
          
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
          
          console.log('   💾 Data:', signatureData ? '✓ Found' : '✗ Missing');
          
          if (signatureData) {
            allSignatures[field.id] = {
              type: field.type,
              data: signatureData,
              timestamp: field.timestamp || req.signedAt,
              recipientName: req.recipient?.name,
              recipientEmail: req.recipient?.email,
            };
            console.log('   ✅ Signature saved to allSignatures');
          }
        });
      }
      
      // ⭐ ALSO check sharedSignatures (for shared mode)
      if (req.sharedSignatures) {
        console.log('   🔄 Found shared signatures');
        Object.entries(req.sharedSignatures).forEach(([recipientIndex, sharedSig]: [string, any]) => {
          if (sharedSig.signedFields) {
            sharedSig.signedFields.forEach((field: any) => {
              let signatureData = null;
              
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
              
              if (signatureData && !allSignatures[field.id]) {
                allSignatures[field.id] = {
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
    });

    console.log('\n📊 Final signature count:', Object.keys(allSignatures).length);
    console.log('🔑 Signature IDs:', Object.keys(allSignatures));

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
      status: status,
      signatureFields: signatureFields,
      signatures: allSignatures,
      recipients: signatureRequests.map(req => ({
        name: req.recipient?.name,
        email: req.recipient?.email,
        status: req.status,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching CC data:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}