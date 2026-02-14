//app/api/view/[token]/file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import cloudinary from 'cloudinary';
import { PDFDocument, rgb, StandardFonts, RotationTypes } from 'pdf-lib';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const { email } = await request.json();
    
    const db = await dbPromise;
    
    // Find share record
    const share = await db.collection('shares').findOne({
      shareToken: token
    });

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Get document with file data
    const document = await db.collection('documents').findOne({
      _id: share.documentId
    });

    if (!document || !document.cloudinaryPdfUrl) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch PDF from Cloudinary
    const pdfResponse = await fetch(document.cloudinaryPdfUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
    }

    let pdfBytes = await pdfResponse.arrayBuffer();

    // ⭐ Apply watermark if enabled
    if (share.settings?.enableWatermark) {
      pdfBytes = await addWatermarkToPdf(
        pdfBytes,
        email || 'Anonymous Viewer',
        share.settings.watermarkPosition || 'bottom',
        share.settings.watermarkText || null
      );
    }

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.originalFilename}"`,
        'Content-Length': pdfBytes.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Fetch file error:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

// ✅ GET - Serve PDF file through proxy for shared documents
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    console.log('📄 File request received for token:', token.substring(0, 8) + '...');

    const db = await dbPromise;

    // ✅ Find share record
    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });

    if (!share) {
      return NextResponse.json({ 
        error: 'Share link not found or has been revoked' 
      }, { status: 404 });
    }

    // ✅ Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ 
        error: 'This share link has expired' 
      }, { status: 410 });
    }

    // ✅ Check max views
    if (share.settings?.maxViews && share.tracking?.views >= share.settings.maxViews) {
      return NextResponse.json({ 
        error: 'View limit reached' 
      }, { status: 403 });
    }

    // ✅ Get document
    const document = await db.collection('documents').findOne({
      _id: share.documentId,
    });

    if (!document || !document.cloudinaryPdfUrl) {
      return NextResponse.json({ 
        error: 'Document file not found' 
      }, { status: 404 });
    }

    // ✅ Check if it's a print request (and if printing is disabled)
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'print' && !share.settings?.allowPrint) {
      // ⭐ Track blocked print attempt
      await db.collection('shares').updateOne(
        { _id: share._id },
        { 
          $inc: { 'tracking.blockedPrints': 1 },
          $push: { 
            'tracking.printEvents': {
              timestamp: new Date(),
              allowed: false,
              blocked: true,
            }
          } as any
        }
      ).catch(err => console.error('Failed to track blocked print:', err));

      return NextResponse.json({ 
        error: 'Printing is not allowed for this document' 
      }, { status: 403 });
    }

    try {
      // ✅ Extract public_id from Cloudinary URL
      const urlParts = document.cloudinaryPdfUrl.split('/upload/');
      if (urlParts.length < 2) {
        throw new Error('Invalid Cloudinary URL format');
      }

      const afterUpload = urlParts[1];
      const pathParts = afterUpload.split('/');
      pathParts.shift(); // remove version (e.g., v1234567890)
      let publicId = pathParts.join('/').replace('.pdf', '');
      publicId = decodeURIComponent(publicId);

      console.log('📄 Serving shared document:', {
        shareToken: token.substring(0, 8) + '...',
        publicId,
        filename: document.originalFilename,
        watermarkEnabled: share.settings?.enableWatermark || false,
      });

      // ✅ Generate signed download URL with expiration
      const downloadUrl = cloudinary.v2.utils.private_download_url(
        publicId,
        'pdf',
        {
          resource_type: 'image',
          type: 'upload',
          attachment: false, // inline for viewing
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        }
      );

      // ✅ Fetch file from Cloudinary
      // ✅ Fetch with longer timeout and retry logic
const fetchWithTimeout = async (url: string, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

let cloudinaryResponse;
let retries = 3;

while (retries > 0) {
  try {
    console.log(`🔄 Fetching from Cloudinary (${4 - retries}/3)...`);
    cloudinaryResponse = await fetchWithTimeout(downloadUrl, 30000); // 30 second timeout
    
    if (cloudinaryResponse.ok) {
      break; // Success!
    }
    
    console.warn(`⚠️ Cloudinary returned ${cloudinaryResponse.status}, retrying...`);
    retries--;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    
  } catch (error) {
    console.error(`❌ Cloudinary fetch failed (${4 - retries}/3):`, error);
    retries--;
    
    if (retries === 0) {
      throw error; // All retries exhausted
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
  }
}

if (!cloudinaryResponse) {
  throw new Error('Failed to fetch from Cloudinary after 3 retries');
}
 
      if (!cloudinaryResponse.ok) {
        console.error('❌ Cloudinary fetch failed:', cloudinaryResponse.status);
        return NextResponse.json({ 
          error: 'Failed to fetch file from storage',
          status: cloudinaryResponse.status,
        }, { status: 500 });
      }

      let arrayBuffer = await cloudinaryResponse.arrayBuffer();

      // ⭐ APPLY WATERMARK IF ENABLED
      if (share.settings?.enableWatermark) {
        console.log('💧 Applying watermark...');
        
        // Get viewer email from tracking (last viewer email)
        const viewerEmail = share.tracking?.viewerEmails?.[share.tracking.viewerEmails.length - 1] || 
                           'Confidential Document';
        
        arrayBuffer = await addWatermarkToPdf(
          arrayBuffer,
          viewerEmail,
          share.settings.watermarkPosition || 'bottom',
          share.settings.watermarkText || null
        );

        console.log('✅ Watermark applied');
      }

      console.log('✅ File served:', arrayBuffer.byteLength, 'bytes');

      // ✅ Track file view in share analytics
      await db.collection('shares').updateOne(
        { _id: share._id },
        { 
          $inc: { 'tracking.fileViews': 1 },
          $set: { 
            updatedAt: new Date(),
            'tracking.lastViewedAt': new Date(),
          }
        }
      ).catch(err => console.error('Failed to track file view:', err));

      // ⭐ Track print if action=print
      if (action === 'print') {
        await db.collection('shares').updateOne(
          { _id: share._id },
          { 
            $inc: { 'tracking.prints': 1 },
            $push: { 
              'tracking.printEvents': {
                timestamp: new Date(),
                allowed: true,
                viewerEmail: share.tracking?.viewerEmails?.[share.tracking.viewerEmails.length - 1] || null,
              }
            } as any
          }
        ).catch(err => console.error('Failed to track print:', err));
      }

      // ✅ Return PDF file
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${document.originalFilename}"`,
          'Content-Length': arrayBuffer.byteLength.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate', // ⭐ Prevent caching watermarked PDFs
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
        },
      });

    } catch (error) {
      console.error('❌ Failed to serve file:', error);
      return NextResponse.json({ 
        error: 'Failed to serve file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ File proxy error:', error);
    return NextResponse.json({
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ⭐⭐⭐ WATERMARK FUNCTION - PRODUCTION READY ⭐⭐⭐
async function addWatermarkToPdf(
  pdfBytes: ArrayBuffer,
  viewerIdentifier: string,
  position: string = 'bottom',
  customText: string | null = null
): Promise<ArrayBuffer> {
  try {
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Watermark text
    const watermarkText = customText || `Confidential - ${viewerIdentifier}`;
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Calculate text dimensions
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const timestampWidth = font.widthOfTextAtSize(`Viewed: ${timestamp}`, 8);

    // Add watermark to each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      let x = 0;
      let y = 0;
      let rotation = 0;

      // Position watermark based on setting
      switch (position) {
        case 'top':
          x = width / 2 - textWidth / 2;
          y = height - 30;
          
          // Main watermark text
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font: boldFont,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.6,
          });
          
          // Timestamp
          page.drawText(`Viewed: ${timestamp}`, {
            x: width / 2 - timestampWidth / 2,
            y: y - 15,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.5,
          });
          break;

        case 'center':
          x = width / 2 - textWidth / 2;
          y = height / 2;
          
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font: boldFont,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.3,
          });
          break;

        case 'diagonal':
          // Diagonal watermark across center
          x = width / 2;
          y = height / 2;
          rotation = -45;
          
          page.drawText(watermarkText, {
            x,
            y,
            size: 14,
            font: boldFont,
            color: rgb(0.8, 0.8, 0.8),
            opacity: 0.15,
            rotate: { angle: rotation, type: RotationTypes.Degrees },
          });
          
          // Add timestamp at bottom
          page.drawText(`Viewed: ${timestamp}`, {
            x: 50,
            y: 20,
            size: 7,
            font,
            color: rgb(0.6, 0.6, 0.6),
            opacity: 0.5,
          });
          break;

        default: // 'bottom'
          x = 50;
          y = 30;
          
          // Main watermark text
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font: boldFont,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.6,
          });
          
          // Timestamp on same line
          page.drawText(`• Viewed: ${timestamp}`, {
            x: x + textWidth + 10,
            y,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.5,
          });
          
          // Page number (optional)
          page.drawText(`Page ${i + 1} of ${pages.length}`, {
            x: width - 100,
            y: 20,
            size: 8,
            font,
            color: rgb(0.6, 0.6, 0.6),
            opacity: 0.5,
          });
          break;
      }
    }

    // Save and return the watermarked PDF
    const watermarkedPdfBytes = await pdfDoc.save();
    return watermarkedPdfBytes.buffer as ArrayBuffer;

  } catch (error) {
    console.error('❌ Watermarking error:', error);
    // Return original PDF if watermarking fails
    return pdfBytes;
  }
}