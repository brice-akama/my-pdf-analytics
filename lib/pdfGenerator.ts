// lib/pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import cloudinary from 'cloudinary';
import { dbPromise } from '@/app/api/lib/mongodb';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function generateSignedPDF(
  documentId: string,
  signatureRequests: any[]
): Promise<string> {
  try {
    console.log('🎨 Generating signed PDF for document:', documentId);

    // 1. Load DB
    const db = await dbPromise;
    const { ObjectId } = await import('mongodb');
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
    });
    if (!document || !document.cloudinaryPdfUrl) {
      throw new Error('Original PDF not found');
    }

    console.log('📄 Original Cloudinary URL:', document.cloudinaryPdfUrl);

    // 2. Extract publicId from Cloudinary URL
    const urlParts = document.cloudinaryPdfUrl.split('/upload/');
    if (urlParts.length < 2) {
      throw new Error('Invalid Cloudinary URL format');
    }

    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift(); // Remove version (e.g., v1234567890)
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);
    console.log('🔑 Public ID:', publicId);

    // Detect resource type from URL
    const resourceType = document.cloudinaryPdfUrl.includes('/image/upload/') ? 'image' : 'raw';
    console.log('📦 Resource type:', resourceType);

    // 3. Generate authenticated download URL using private_download_url
    const downloadUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: resourceType,
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated private download URL');

    // 4. Download PDF using the authenticated URL
    let pdfBytes: ArrayBuffer;
    
    console.log('📥 Downloading PDF from Cloudinary...');
    const pdfResponse = await fetch(downloadUrl);
    
    if (!pdfResponse.ok) {
      console.error('❌ Download failed:', pdfResponse.status, pdfResponse.statusText);
      const errorText = await pdfResponse.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    pdfBytes = await pdfResponse.arrayBuffer();
    console.log('✅ PDF downloaded, size:', pdfBytes.byteLength, 'bytes');

    // Load PDF into pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    console.log('📄 PDF Pages:', pages.length);

    // Insert signature field content
    for (const request of signatureRequests) {
      if (request.status !== "signed" || !request.signedFields) continue;
      for (const field of request.signatureFields) {
        const signedField = request.signedFields.find(
          (sf: any) => sf.id === field.id
        );
        if (!signedField) continue;
        const pageIndex = field.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        const x = (field.x / 100) * width;
        const y = height - (field.y / 100) * height;
        const fieldWidth = field.width ? (field.width / 100) * width : 180;
        const fieldHeight = field.height ? (field.height / 100) * height : 60;

        // SIGNATURE IMAGE
        if (field.type === "signature" && signedField.signatureData) {
          try {
            const base64 = signedField.signatureData.replace(
              /^data:image\/\w+;base64,/,
              ""
            );
            const imgBytes = Buffer.from(base64, "base64");
            let image;
            if (signedField.signatureData.includes("image/png")) {
              image = await pdfDoc.embedPng(imgBytes);
            } else {
              image = await pdfDoc.embedJpg(imgBytes);
            }
            page.drawImage(image, {
              x,
              y: y - fieldHeight,
              width: fieldWidth,
              height: fieldHeight,
            });
          } catch {
            page.drawText("Signed", {
              x,
              y: y - 30,
              size: 14,
              font,
              color: rgb(0.2, 0.2, 0.8),
            });
          }
        }

        // DATE FIELD
        if (field.type === "date" && signedField.dateValue) {
          page.drawText(signedField.dateValue, {
            x,
            y: y - 25,
            size: 11,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // TEXT FIELD
        if (field.type === "text" && signedField.textValue) {
          page.drawText(signedField.textValue, {
            x,
            y: y - 25,
            size: 11,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // Signer label
        page.drawText(`${request.recipient.name}`, {
          x,
          y: y - fieldHeight - 12,
          size: 8,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });

        const timestamp = new Date(request.signedAt).toLocaleString();
        page.drawText(`Signed: ${timestamp}`, {
          x,
          y: y - fieldHeight - 24,
          size: 7,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    // AUDIT TRAIL
    const lastPage = pages[pages.length - 1];
    let auditY = 35;
    lastPage.drawText("AUDIT TRAIL", {
      x: 50,
      y: 50,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    for (const req of signatureRequests) {
      if (req.status === "signed") {
        const txt = `${req.recipient.name} (${req.recipient.email}) - Signed: ${new Date(
          req.signedAt
        ).toLocaleString()}`;
        lastPage.drawText(txt, {
          x: 50,
          y: auditY,
          size: 7,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        auditY -= 12;
      }
    }
// Save signed PDF
    const finalPdfBytes = await pdfDoc.save();
    console.log('💾 Signed PDF generated, size:', finalPdfBytes.byteLength, 'bytes');

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "signed_documents",
          resource_type: "image",
          public_id: `signed_${documentId.replace(/\n/g, '')}_${Date.now()}`, // REMOVE LINE BREAKS FROM documentId
          type: "upload",
          format: "pdf",
          overwrite: true,
          invalidate: true,
          access_mode: "public", // MAKE IT PUBLIC SO NO AUTH NEEDED
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("✅ Upload successful");
            resolve(result);
          }
        }
      );

      uploadStream.end(Buffer.from(finalPdfBytes));
    });

    // Get the secure URL and clean it
    let signedUrl = uploadResult.secure_url;
    signedUrl = signedUrl.replace(/\s+/g, ''); // Remove ALL whitespace
    
    console.log("🔗 Signed PDF URL:", signedUrl);
    console.log("🔗 URL Length:", signedUrl.length);
    console.log("🔗 Has line breaks?:", /\n/.test(signedUrl));
    
    return signedUrl;

  } catch (error) {
    console.error("❌ Error generating signed PDF:", error);
    throw error;
  }
}