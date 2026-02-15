import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { PDFDocument } from 'pdf-lib';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const pageNum = parseInt(searchParams.get('page') || '1');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 PAGE API CALLED');
    console.log('   Document ID:', id);
    console.log('   Page Number:', pageNum);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const db = await dbPromise;
    
    // ✅ TRY BOTH: First as string ID, then as ObjectId
    let document = await db.collection('documents').findOne({ id: id });
    
    if (!document && ObjectId.isValid(id)) {
      console.log('🔄 Trying with ObjectId...');
      document = await db.collection('documents').findOne({ _id: new ObjectId(id) });
    }

    if (!document) {
      console.error('❌ Document not found with ID:', id);
      return NextResponse.json({ 
        error: 'Document not found',
        searchedId: id 
      }, { status: 404 });
    }

    console.log('✅ Document found:', document.originalFilename);

    // Get Cloudinary PDF URL
    const cloudinaryPdfUrl = document.cloudinaryPdfUrl || document.url || document.pdfUrl;
    
    if (!cloudinaryPdfUrl) {
      console.error('❌ No Cloudinary PDF URL found in document');
      console.error('   Available fields:', Object.keys(document));
      return NextResponse.json({ 
        error: 'PDF file not available',
        availableFields: Object.keys(document)
      }, { status: 404 });
    }

    console.log('📄 Cloudinary URL:', cloudinaryPdfUrl);

    // Extract public_id from Cloudinary URL
    const urlParts = cloudinaryPdfUrl.split('/upload/');
    if (urlParts.length < 2) {
      console.error('❌ Invalid Cloudinary URL format:', cloudinaryPdfUrl);
      return NextResponse.json({ 
        error: 'Invalid PDF URL format',
        url: cloudinaryPdfUrl 
      }, { status: 400 });
    }

    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift(); // remove version (v1234567890)
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    console.log('📝 Extracted Public ID:', publicId);

    // Generate authenticated private download URL
    const downloadUrl = cloudinary.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        attachment: false,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated authenticated download URL');

    // Fetch the PDF from Cloudinary
    const cloudinaryResponse = await fetch(downloadUrl);
    
    console.log('📡 Cloudinary response status:', cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      console.error('❌ Failed to fetch from Cloudinary');
      console.error('   Status:', cloudinaryResponse.status);
      console.error('   Status Text:', cloudinaryResponse.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch PDF from Cloudinary',
        status: cloudinaryResponse.status,
        statusText: cloudinaryResponse.statusText
      }, { status: 500 });
    }

    const pdfArrayBuffer = await cloudinaryResponse.arrayBuffer();
    console.log('✅ PDF fetched:', pdfArrayBuffer.byteLength, 'bytes');

    // Load PDF and extract the requested page
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    console.log('📚 Total pages:', totalPages, '| Requested:', pageNum);

    if (pageNum < 1 || pageNum > totalPages) {
      console.error('❌ Invalid page number:', pageNum);
      return NextResponse.json({ 
        error: 'Invalid page number',
        totalPages,
        requestedPage: pageNum 
      }, { status: 400 });
    }

    // Create new PDF with only the requested page
    const singlePagePdf = await PDFDocument.create();
    const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [pageNum - 1]);
    singlePagePdf.addPage(copiedPage);

    const singlePageBytes = await singlePagePdf.save();

    console.log('✅ Extracted page', pageNum, ':', singlePageBytes.byteLength, 'bytes');

    // Convert Uint8Array to Buffer
    const buffer = Buffer.from(singlePageBytes);

    console.log('🎉 SUCCESS! Returning single-page PDF');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Return the single-page PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.originalFilename}-page-${pageNum}.pdf"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ FATAL ERROR in page extraction');
    console.error('   Error:', error);
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return NextResponse.json({ 
      error: 'Failed to extract page',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}