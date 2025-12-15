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
        
        // Calculate field dimensions - Match signing page exactly
        const fieldWidth = field.width || (field.type === 'signature' ? 200 : 150);
        const fieldHeight = field.height || (field.type === 'signature' ? 60 : 40);

        // Convert percentage to PDF points
        const xInPoints = (field.x / 100) * width;
        const yFromTop = (field.y / 100) * height;

        // Center horizontally
        const x = xInPoints - (fieldWidth / 2);

        // PDF coordinates are bottom-up, so flip Y
        const y = height - yFromTop - fieldHeight;

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
              x: x,
              y: y,
              width: fieldWidth,
              height: fieldHeight,
            });
          } catch (err) {
            console.error('Failed to embed signature image:', err);
            page.drawText("Signed", {
              x: x + 10,
              y: y + (fieldHeight / 2) - 7,
              size: 14,
              font,
              color: rgb(0.2, 0.2, 0.8),
            });
          }
        }

        // DATE FIELD
        if (field.type === "date" && signedField.dateValue) {
          const textWidth = font.widthOfTextAtSize(signedField.dateValue, 11);
          page.drawText(signedField.dateValue, {
            x: x + (fieldWidth - textWidth) / 2,
            y: y + (fieldHeight / 2) - 4,
            size: 11,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // TEXT FIELD
        if (field.type === "text" && signedField.textValue) {
          const textWidth = font.widthOfTextAtSize(signedField.textValue, 11);
          page.drawText(signedField.textValue, {
            x: x + (fieldWidth - textWidth) / 2,
            y: y + (fieldHeight / 2) - 4,
            size: 11,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }
    }

    // AUDIT TRAIL - Add a new page
    let auditTrailPage = pdfDoc.addPage([pages[0].getWidth(), pages[0].getHeight()]);
    let auditY = auditTrailPage.getHeight() - 50;

    // Draw separator line
    auditTrailPage.drawLine({
      start: { x: 50, y: auditY + 10 },
      end: { x: auditTrailPage.getWidth() - 50, y: auditY + 10 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Title
    auditTrailPage.drawText("AUDIT TRAIL", {
      x: 50,
      y: auditY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    auditY -= 20;

    // Document metadata
    auditTrailPage.drawText(`Document ID: ${documentId}`, {
      x: 50,
      y: auditY,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    auditY -= 15;

    auditTrailPage.drawText(`Completed: ${new Date().toLocaleString()}`, {
      x: 50,
      y: auditY,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    auditY -= 20;

    // Signers section
    auditTrailPage.drawText("Signers:", {
      x: 50,
      y: auditY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    auditY -= 15;

    // Generate document hash for tamper-proofing
    const crypto = require('crypto');
    const documentHash = crypto.createHash('sha256').update(JSON.stringify(signatureRequests)).digest('hex');

    // List all signers
    for (const req of signatureRequests) {
      if (req.status === "signed") {
        const signerName = req.recipient.name || "Unknown";
        const signerEmail = req.recipient.email || "Unknown";
        const signedAt = req.signedAt ? new Date(req.signedAt).toLocaleString() : "Unknown";

        auditTrailPage.drawText(`${signerName} (${signerEmail})`, {
          x: 50,
          y: auditY,
          size: 9,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        auditY -= 12;

        auditTrailPage.drawText(`   • Signed: ${signedAt}`, {
          x: 55,
          y: auditY,
          size: 8,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        auditY -= 10;

        // Document viewed timestamp
        if (req.viewedAt) {
          const viewedAt = new Date(req.viewedAt).toLocaleString();
          auditTrailPage.drawText(`   • Viewed: ${viewedAt}`, {
            x: 55,
            y: auditY,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
          auditY -= 10;
        }

        // Email delivery status
        if (req.emailOpened) {
          const emailOpenedAt = new Date(req.emailOpenedAt).toLocaleString();
          auditTrailPage.drawText(`   • Email opened: ${emailOpenedAt}`, {
            x: 55,
            y: auditY,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
          auditY -= 10;
        }

        // IP Address and Location
        if (req.recipient.ipAddress) {
          let locationText = `   • IP: ${req.recipient.ipAddress}`;
          
          if (req.recipient.location) {
            const loc = req.recipient.location;
            const locationParts = [loc.city, loc.region, loc.country].filter(Boolean);
            if (locationParts.length > 0) {
              locationText += ` (${locationParts.join(', ')})`;
            }
          }
          
          auditTrailPage.drawText(locationText, {
            x: 55,
            y: auditY,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
          auditY -= 10;
        }

        // Device & Browser info
        if (req.recipient.device || req.recipient.browser) {
          let deviceText = '   • Device: ';
          const deviceParts = [];
          
          if (req.recipient.browser) deviceParts.push(req.recipient.browser);
          if (req.recipient.os) deviceParts.push(req.recipient.os);
          if (req.recipient.deviceType) deviceParts.push(req.recipient.deviceType);
          
          if (deviceParts.length > 0) {
            deviceText += deviceParts.join(', ');
            auditTrailPage.drawText(deviceText, {
              x: 55,
              y: auditY,
              size: 8,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
            auditY -= 10;
          }
        }

        auditY -= 5;

        // Add new page if running out of space
        if (auditY < 100) {
          auditTrailPage = pdfDoc.addPage([auditTrailPage.getWidth(), auditTrailPage.getHeight()]);
          auditY = auditTrailPage.getHeight() - 50;
        }
      }
    }

    // Document hash
    auditTrailPage.drawText(`Document Hash: ${documentHash}`, {
      x: 50,
      y: auditY,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    auditY -= 15;

    // Footer
    auditTrailPage.drawLine({
      start: { x: 50, y: auditY + 5 },
      end: { x: auditTrailPage.getWidth() - 50, y: auditY + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    auditTrailPage.drawText("This document was signed electronically via DocSend and is legally binding.", {
      x: 50,
      y: auditY - 5,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    console.log('🧾 Audit trail page added');

    // Save the signed PDF with audit trail (FIRST SAVE)
    const signedPdfBytes = await pdfDoc.save();
    console.log('💾 Signed PDF generated, size:', signedPdfBytes.byteLength, 'bytes');

    // ⭐ CHECK FOR ATTACHMENTS AND MERGE
    const attachments = await db.collection("signature_attachments")
      .find({ documentId: documentId })
      .sort({ uploadedAt: 1 })
      .toArray();

    console.log(`📎 Found ${attachments.length} attachments to merge`);

    let finalPdfBytes: Uint8Array;

    if (attachments.length > 0) {
      console.log(`📎 Merging ${attachments.length} attachments...`);
      
      try {
        // Load the signed PDF
        const mergedPdf = await PDFDocument.load(signedPdfBytes);
        
        // Add separator page
        const separatorPage = mergedPdf.addPage();
        const { width, height } = separatorPage.getSize();
        
        separatorPage.drawText('ATTACHMENTS', {
          x: 50,
          y: height - 100,
          size: 28,
          font: boldFont,
        });
        
        separatorPage.drawText(
          'The following pages contain supporting documents uploaded by signers.',
          {
            x: 50,
            y: height - 150,
            size: 12,
            font: font,
          }
        );
        
        separatorPage.drawText(
          `Total Attachments: ${attachments.length}`,
          {
            x: 50,
            y: height - 180,
            size: 12,
            font: font,
          }
        );

        separatorPage.drawLine({
          start: { x: 50, y: height - 200 },
          end: { x: width - 50, y: height - 200 },
          thickness: 2,
          color: rgb(0, 0, 0),
        });

        console.log('✅ Added separator page');

        // Process each attachment
        for (let i = 0; i < attachments.length; i++) {
          const attachment = attachments[i];
          console.log(`📎 Processing attachment ${i + 1}/${attachments.length}: ${attachment.filename}`);

          try {
            if (attachment.fileType === 'application/pdf') {
              // ⭐ HANDLE PDF ATTACHMENTS WITH AUTHENTICATION
              console.log(`  Fetching PDF attachment: ${attachment.filename}`);
              
              const attachmentPublicId = attachment.cloudinaryPublicId;
              
              if (!attachmentPublicId) {
                console.error(`  ❌ No public_id for attachment: ${attachment.filename}`);
                continue;
              }
              
              console.log(`  🔑 Attachment Public ID: ${attachmentPublicId}`);
              
              // Determine resource type
              const attachmentResourceType = 'image'; // PDFs are stored as 'image' in Cloudinary
              
              // Generate authenticated download URL
              const authenticatedAttachmentUrl = cloudinary.v2.utils.private_download_url(
                attachmentPublicId,
                'pdf',
                {
                  resource_type: attachmentResourceType,
                  type: 'upload',
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                }
              );
              
              console.log(`  🔐 Generated authenticated URL for attachment`);
              
              // Fetch with authenticated URL
              const pdfResponse = await fetch(authenticatedAttachmentUrl);
              
              if (!pdfResponse.ok) {
                console.error(`  ❌ Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
                continue;
              }
              
              const pdfAttachmentBytes = await pdfResponse.arrayBuffer();
              console.log(`  ✅ Downloaded attachment: ${pdfAttachmentBytes.byteLength} bytes`);
              
              const attachmentPdf = await PDFDocument.load(pdfAttachmentBytes);
              
              // Add header page
              const headerPage = mergedPdf.addPage();
              const { width: hw, height: hh } = headerPage.getSize();
              
              headerPage.drawText(`Attachment ${i + 1}: ${attachment.filename}`, {
                x: 50,
                y: hh - 100,
                size: 16,
                font: boldFont,
              });
              
              if (attachment.recipientName) {
                headerPage.drawText(`Uploaded by: ${attachment.recipientName}`, {
                  x: 50,
                  y: hh - 130,
                  size: 10,
                  font: font,
                });
              }
              
              if (attachment.uploadedAt) {
                headerPage.drawText(
                  `Date: ${new Date(attachment.uploadedAt).toLocaleString()}`,
                  {
                    x: 50,
                    y: hh - 150,
                    size: 10,
                    font: font,
                  }
                );
              }

              // Copy all pages from attachment
              const copiedPages = await mergedPdf.copyPages(
                attachmentPdf,
                attachmentPdf.getPageIndices()
              );
              
              copiedPages.forEach(page => mergedPdf.addPage(page));
              console.log(`  ✅ Added ${copiedPages.length} pages from ${attachment.filename}`);

            } else if (attachment.fileType.startsWith('image/')) {
              // ⭐ HANDLE IMAGE ATTACHMENTS WITH AUTHENTICATION
              console.log(`  Fetching image attachment: ${attachment.filename}`);
              
              const attachmentPublicId = attachment.cloudinaryPublicId;
              
              if (!attachmentPublicId) {
                console.error(`  ❌ No public_id for attachment: ${attachment.filename}`);
                continue;
              }
              
              console.log(`  🔑 Image Public ID: ${attachmentPublicId}`);
              
              // Generate authenticated download URL
              const authenticatedImageUrl = cloudinary.v2.utils.private_download_url(
                attachmentPublicId,
                '',
                {
                  resource_type: 'image',
                  type: 'upload',
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                }
              );
              
              console.log(`  🔐 Generated authenticated URL for image`);
              
              const imageResponse = await fetch(authenticatedImageUrl);
              
              if (!imageResponse.ok) {
                console.error(`  ❌ Failed to fetch image: ${imageResponse.status}`);
                continue;
              }
              
              const imageBytes = await imageResponse.arrayBuffer();
              console.log(`  ✅ Downloaded image: ${imageBytes.byteLength} bytes`);
              
              let embeddedImage;
              if (attachment.fileType === 'image/png') {
                embeddedImage = await mergedPdf.embedPng(imageBytes);
              } else if (attachment.fileType === 'image/jpeg' || attachment.fileType === 'image/jpg') {
                embeddedImage = await mergedPdf.embedJpg(imageBytes);
              } else {
                console.warn(`  ⚠️ Unsupported image type: ${attachment.fileType}`);
                continue;
              }

              // Create page for image
              const imageDims = embeddedImage.scale(1);
              const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const MARGIN = 50;

const maxWidth = PAGE_WIDTH - MARGIN * 2;
const maxHeight = PAGE_HEIGHT - MARGIN * 2;

              
              let imageWidth = imageDims.width;
              let imageHeight = imageDims.height;
              
              // Scale if needed
              if (imageWidth > maxWidth || imageHeight > maxHeight) {
                const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
                imageWidth *= scale;
                imageHeight *= scale;
              }

              const imagePage = mergedPdf.addPage([maxWidth, maxHeight]);
              
              const x = (maxWidth - imageWidth) / 2;
              const y = (maxHeight - imageHeight) / 2;
              
              imagePage.drawImage(embeddedImage, {
                x,
                y,
                width: imageWidth,
                height: imageHeight,
              });

              // Add caption
              imagePage.drawText(`Attachment: ${attachment.filename}`, {
                x: 50,
                y: 30,
                size: 10,
                font: font,
              });

              console.log(`  ✅ Added image: ${attachment.filename}`);

            } else {
              // For other file types, add reference page
              console.warn(`  ⚠️ Cannot embed ${attachment.fileType}, adding reference page`);
              
              const refPage = mergedPdf.addPage();
              const { height: rh } = refPage.getSize();
              
              refPage.drawText(`Attachment ${i + 1}: ${attachment.filename}`, {
                x: 50,
                y: rh - 100,
                size: 16,
                font: boldFont,
              });
              
              refPage.drawText('This file type cannot be embedded directly in PDF.', {
                x: 50,
                y: rh - 150,
                size: 12,
                font: font,
              });
              
              refPage.drawText(`File Type: ${attachment.fileType}`, {
                x: 50,
                y: rh - 180,
                size: 10,
                font: font,
              });
              
              refPage.drawText(
                'Please download this file separately from the signature portal.',
                {
                  x: 50,
                  y: rh - 210,
                  size: 10,
                  font: font,
                }
              );
            }

          } catch (attachErr) {
            console.error(`  ❌ Failed to process attachment ${attachment.filename}:`, attachErr);
            // Continue with other attachments
          }
        }

        // Save merged PDF (SECOND SAVE)
        finalPdfBytes = await mergedPdf.save();
        console.log('✅ Successfully merged attachments into PDF');
        
      } catch (mergeError) {
        console.error('❌ Failed to merge attachments:', mergeError);
        // Fallback to signed PDF without attachments
        finalPdfBytes = signedPdfBytes;
      }
    } else {
      console.log('📄 No attachments to merge');
      finalPdfBytes = signedPdfBytes;
    }

    // Upload final PDF to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "signed_documents",
          resource_type: "image",
          public_id: `signed_${documentId.replace(/\n/g, '')}_${Date.now()}`,
          type: "upload",
          format: "pdf",
          overwrite: true,
          invalidate: true,
          access_mode: "public",
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
    signedUrl = signedUrl.replace(/\s+/g, '');
    
    console.log("🔗 Signed PDF URL:", signedUrl);
    console.log("🔗 URL Length:", signedUrl.length);
    console.log("🔗 Has line breaks?:", /\n/.test(signedUrl));
    
    return signedUrl;

  } catch (error) {
    console.error("❌ Error generating signed PDF:", error);
    throw error;
  }
}