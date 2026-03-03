// app/api/documents/[id]/file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

   // ⭐ FIX: Allow access if user owns document OR has signature request for it
const document = await db.collection('documents').findOne({
  _id: documentId,
});

if (!document) {
  return NextResponse.json({ error: 'Document not found' }, { status: 404 });
}

// ⭐ Check if user has access (owns document OR is a recipient)
const isOwner = document.userId === user.id;
const hasSignatureRequest = await db.collection('signature_requests').findOne({
  documentId: id,
  'recipient.email': user.email,
});
const isCCRecipient = await db.collection('cc_recipients').findOne({
  documentId: id,
  email: user.email,
});

 // Check if doc is shared to team AND user is in that team
let isTeamMember = false;
if (document.sharedToTeam && document.workspaceId) {
  const profile = await db.collection('profiles').findOne({ user_id: user.id });
  const userOrgId = profile?.organization_id || user.id;
  
  // User belongs to same workspace
  if (userOrgId === document.workspaceId) {
    isTeamMember = true;
  } else {
    // Also check if user is an active member of that org
    const memberRecord = await db.collection('organization_members').findOne({
      organizationId: document.workspaceId,
      $or: [{ userId: user.id }, { email: user.email }],
      status: 'active',
    });
    isTeamMember = !!memberRecord;
  }
}

const hasAccess = isOwner || hasSignatureRequest || isCCRecipient || isTeamMember;

console.log('✅ Access check:', {
  isOwner,
  hasSignatureRequest: !!hasSignatureRequest,
  isCCRecipient: !!isCCRecipient,
  isTeamMember,
});

if (!hasAccess) {
  console.log('❌ Access denied for user:', user.email);
  console.log('   Document owner:', document.userId);
  console.log('   Has signature request:', !!hasSignatureRequest);
  console.log('   Is CC recipient:', !!isCCRecipient);
  
  return NextResponse.json({ 
    error: 'Access denied',
    details: 'You do not have permission to view this document'
  }, { status: 403 });
}

console.log('✅ Access granted:', {
  isOwner,
  hasSignatureRequest: !!hasSignatureRequest,
  isCCRecipient: !!isCCRecipient,
});

    if (!document.cloudinaryPdfUrl) {
      return NextResponse.json(
        {
          error: 'File not found in storage',
          details: 'PDF file URL is missing from document record',
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'view';
    const format = searchParams.get('format') || 'pdf';
    const page = searchParams.get('page');
    const serve = searchParams.get('serve');

    let fileUrl =
      format === 'original' && document.cloudinaryOriginalUrl
        ? document.cloudinaryOriginalUrl
        : document.cloudinaryPdfUrl;

    const filename =
      format === 'original'
        ? document.originalFilename
        : document.originalFilename.replace(/\.[^/.]+$/, '.pdf');

    // Tracking
    const tracking = document.tracking || {
      views: 0,
      uniqueVisitors: [],
      downloads: 0,
      shares: 0,
      averageViewTime: 0,
      viewsByPage: Array(document.numPages || 1).fill(0),
      lastViewed: null,
    };

    if (action === 'download') {
      tracking.downloads += 1;
    } else {
      tracking.views += 1;
      if (page && !isNaN(parseInt(page))) {
        const pageIndex = parseInt(page) - 1;
        if (pageIndex >= 0 && pageIndex < tracking.viewsByPage.length) {
          tracking.viewsByPage[pageIndex] += 1;
        }
      }
    }
    tracking.lastViewed = new Date();

    db.collection('documents')
      .updateOne(
        { _id: documentId },
        { $set: { tracking, lastAccessedAt: new Date() } }
      )
      .catch((err) => console.error('Failed to update tracking:', err));

    db.collection('analytics_logs')
      .insertOne({
        documentId: id,
        action: action === 'download' ? 'download' : 'file_view',
        userId: user.id,
        format,
        page: page ? parseInt(page) : null,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      })
      .catch((err) => console.error('Failed to log analytics:', err));

    // If serve=blob, use authenticated download
    if (serve === 'blob') {
      try {
        // Extract public_id from URL
        const urlParts = fileUrl.split('/upload/');
        const afterUpload = urlParts[1];
        const pathParts = afterUpload.split('/');
        pathParts.shift(); // remove version
        let publicId = pathParts.join('/').replace('.pdf', '');
        publicId = decodeURIComponent(publicId);

        console.log('📝 Public ID:', publicId);

        // Use Cloudinary's authenticated download URL
        const downloadUrl = cloudinary.v2.utils.private_download_url(
          publicId,
          'pdf', // format
          {
            resource_type: 'image',
            type: 'upload',
            attachment: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600
          }
        );

        console.log('🔐 Generated private download URL');
        console.log('🌐 Fetching from private URL...');

        const cloudinaryResponse = await fetch(downloadUrl);
        
        console.log('📡 Response status:', cloudinaryResponse.status);
        console.log('📄 Content-Type:', cloudinaryResponse.headers.get('content-type'));

        if (!cloudinaryResponse.ok) {
          console.error('❌ Private download failed');
          console.error('Response headers:', Object.fromEntries(cloudinaryResponse.headers.entries()));
          
          return NextResponse.json({ 
            error: 'Failed to fetch file from Cloudinary',
            status: cloudinaryResponse.status,
            details: 'Private download URL failed',
            publicId,
          }, { status: 500 });
        }

        const arrayBuffer = await cloudinaryResponse.arrayBuffer();
        console.log('✅ File fetched:', arrayBuffer.byteLength, 'bytes');

        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${action === 'download' ? 'attachment' : 'inline'}; filename="${filename}"`,
            'Content-Length': arrayBuffer.byteLength.toString(),
            'Cache-Control': 'private, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('❌ Failed to fetch PDF:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Default: Return metadata with download URL
    const urlParts = fileUrl.split('/upload/');
    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift(); // remove version
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    const downloadUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
    );

    return NextResponse.json({
      success: true,
      fileUrl: downloadUrl,
      filename,
      format: document.originalFormat,
      mimeType: document.mimeType,
      size: format === 'original' ? document.size : document.pdfSize,
      numPages: document.numPages,
      currentPage: page ? parseInt(page) : 1,
      contentDisposition: action === 'download' ? 'attachment' : 'inline',
      documentInfo: {
        id: document._id.toString(),
        originalFilename: document.originalFilename,
        originalFormat: document.originalFormat,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ File fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
// ✅ Optional: Direct file proxy (if you need to serve file directly through your API)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Validate document ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(params.id);

    // ✅ Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.cloudinaryPdfUrl) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action = 'view', format = 'pdf' } = body;

    // ✅ Fetch file from Cloudinary
    const fileUrl = format === 'original' && document.cloudinaryOriginalUrl
      ? document.cloudinaryOriginalUrl
      : document.cloudinaryPdfUrl;

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch file from storage');
    }

    const buffer = await response.arrayBuffer();
    const filename = format === 'original' 
      ? document.originalFilename
      : document.originalFilename.replace(/\.[^/.]+$/, '.pdf');

    // ✅ Track the access
    const tracking = document.tracking || {};
    if (action === 'download') {
      tracking.downloads = (tracking.downloads || 0) + 1;
    } else {
      tracking.views = (tracking.views || 0) + 1;
    }
    tracking.lastViewed = new Date();

    // ✅ Update tracking
    await db.collection('documents').updateOne(
      { _id: documentId },
      { $set: { tracking, lastAccessedAt: new Date() } }
    );

    // ✅ Log analytics
    await db.collection('analytics_logs').insertOne({
      documentId: params.id,
      action: action === 'download' ? 'download' : 'file_view',
      userId: user.id,
      format,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // ✅ Return file with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': document.mimeType || 'application/pdf',
        'Content-Disposition': `${action === 'download' ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('❌ File proxy error:', error);
    return NextResponse.json({
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}