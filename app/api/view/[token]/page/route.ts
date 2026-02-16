// app/api/view/[token]/page/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { PDFDocument } from 'pdf-lib';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const { searchParams } = new URL(request.url);
    const pageNum = parseInt(searchParams.get('page') || '1');

    const db = await dbPromise;

    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const document = await db.collection('documents').findOne({
      _id: share.documentId,
    });

    if (!document?.cloudinaryPdfUrl) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }



    // ✅ Fetch using signed URL
   // ✅ REPLACE WITH THIS
const fileUrl = document.cloudinaryPdfUrl;
const urlParts = fileUrl.split('/upload/');
const afterUpload = urlParts[1];
const pathParts = afterUpload.split('/');
pathParts.shift(); // remove version
let publicId = pathParts.join('/').replace('.pdf', '');
publicId = decodeURIComponent(publicId);

const signedUrl = cloudinary.v2.utils.private_download_url(
  publicId,
  'pdf',
  {
    resource_type: 'image',
    type: 'upload',
    attachment: false,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }
);

const pdfResponse = await fetch(signedUrl);
if (!pdfResponse.ok) {
  return NextResponse.json({ error: 'Failed to fetch PDF from Cloudinary' }, { status: 500 });
}

    const pdfBytes = await pdfResponse.arrayBuffer();

    // ✅ Extract single page
    const fullPdf = await PDFDocument.load(pdfBytes);
    const totalPages = fullPdf.getPageCount();
    const page = Math.max(1, Math.min(pageNum, totalPages));

    const singlePagePdf = await PDFDocument.create();
    const [copiedPage] = await singlePagePdf.copyPages(fullPdf, [page - 1]);
    singlePagePdf.addPage(copiedPage);

    const singlePageBytes = await singlePagePdf.save();

return new NextResponse(Buffer.from(singlePageBytes), {

      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
      },
    });

  } catch (error) {
    console.error('Page extract error:', error);
    return NextResponse.json({ error: 'Failed to extract page' }, { status: 500 });
  }
}