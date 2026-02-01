// app/api/nda-certificates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { generateNdaCertificate } from '@/lib/nda-certificate';

// ✅ GET - Download NDA Acceptance Certificate
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const db = await dbPromise;

    // Find NDA acceptance record
    const acceptance = await db.collection('nda_acceptances').findOne({
      certificateId: id,
    });

    if (!acceptance) {
      return NextResponse.json({
        error: 'Certificate not found',
      }, { status: 404 });
    }

    // Verify ownership (only owner can download certificate)
    const user = await verifyUserFromRequest(request);
    if (user && user.id !== acceptance.ownerId) {
      // Allow public access if accessing via shareId query param
      const { searchParams } = new URL(request.url);
      const shareId = searchParams.get('shareId');
      
      if (!shareId || shareId !== acceptance.shareId) {
        return NextResponse.json({
          error: 'Unauthorized',
        }, { status: 401 });
      }
    }

    // Generate PDF certificate
    const pdfBuffer = generateNdaCertificate({
      certificateId: acceptance.certificateId,
      viewerName: acceptance.viewerName,
      viewerEmail: acceptance.viewerEmail,
      viewerCompany: acceptance.viewerCompany,
      documentTitle: acceptance.documentTitle,
      ownerName: acceptance.ownerName || 'Document Owner',
      ownerCompany: acceptance.ownerCompany || '',
      acceptedAt: new Date(acceptance.timestamp),
      ipAddress: acceptance.ip,
      ndaTextSnapshot: acceptance.ndaTextSnapshot,
      ndaVersion: acceptance.ndaVersion,
    });

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NDA-Certificate-${acceptance.certificateId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Certificate download error:', error);
    return NextResponse.json({
      error: 'Failed to generate certificate',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}