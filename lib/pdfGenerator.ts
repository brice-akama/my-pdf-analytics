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
      // CHECKBOX FIELD
if (field.type === "checkbox" && signedField.textValue !== undefined) {
  const isChecked = signedField.textValue === "true";
  
  if (isChecked) {
    // Draw checked box
    page.drawRectangle({
      x: x + 5,
      y: y + 5,
      width: 20,
      height: 20,
      borderColor: rgb(0.4, 0.2, 0.6),
      borderWidth: 2,
    });
    
    // Draw checkmark
    page.drawText("✓", {
      x: x + 8,
      y: y + 8,
      size: 16,
      font: boldFont,
      color: rgb(0.4, 0.2, 0.6),
    });
  } else {
    // Draw empty box
    page.drawRectangle({
      x: x + 5,
      y: y + 5,
      width: 20,
      height: 20,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 2,
    });
  }
  
  // Draw label if exists
  if (field.label) {
    page.drawText(field.label, {
      x: x + 30,
      y: y + 10,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
  }
}

// DROPDOWN FIELD
if (field.type === "dropdown" && signedField.textValue) {
  const selectedValue = signedField.textValue;
  const textWidth = font.widthOfTextAtSize(selectedValue, 11);
  
  page.drawText(selectedValue, {
    x: x + (fieldWidth - textWidth) / 2,
    y: y + (fieldHeight / 2) - 4,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
}

// RADIO BUTTON FIELD
if (field.type === "radio" && signedField.textValue) {
  const selectedValue = signedField.textValue;
  
  // Draw label if exists
  if (field.label) {
    page.drawText(field.label, {
      x: x + 5,
      y: y + fieldHeight - 15,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  }
  
  // Draw all radio button options
  let optionY = y + fieldHeight - 35;
  const radioSize = 8;
  const lineHeight = 20;
  
  field.options?.forEach((option: string) => {
    const isSelected = option === selectedValue;
    
    // Draw outer circle
    page.drawCircle({
      x: x + 15,
      y: optionY + 5,
      size: radioSize,
      borderColor: rgb(0.4, 0.2, 0.6),
      borderWidth: 2,
    });
    
    // Draw filled circle if selected
    if (isSelected) {
      page.drawCircle({
        x: x + 15,
        y: optionY + 5,
        size: radioSize - 4,
        color: rgb(0.4, 0.2, 0.6),
      });
    }
    
    // Draw option text
    page.drawText(option, {
      x: x + 30,
      y: optionY,
      size: 10,
      font: isSelected ? boldFont : font,
      color: rgb(0, 0, 0),
    });
    
    optionY -= lineHeight; // Move down for next option
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

        

         // ⭐ NEW: ACCESS CODE VERIFICATION
    if (req.accessCodeRequired) {
      auditTrailPage.drawText("AUTHENTICATION:", {
        x: 50,
        y: auditY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      auditY -= 14;

      const accessCodeStatus = req.accessCodeVerifiedAt 
        ? `✓ Verified on ${new Date(req.accessCodeVerifiedAt).toLocaleString()}`
        : "✗ Not verified";
      
      auditTrailPage.drawText(`  • Access Code: ${accessCodeStatus}`, {
        x: 55,
        y: auditY,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      auditY -= 10;

      if (req.accessCodeType) {
        const codeTypeName = req.accessCodeType === 'custom' ? 'Custom code' : req.accessCodeType.replace(/_/g, ' ');
        auditTrailPage.drawText(`  • Code Type: ${codeTypeName}`, {
          x: 55,
          y: auditY,
          size: 8,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        auditY -= 10;
      }

      if (req.accessCodeFailedAttempts > 0) {
        auditTrailPage.drawText(`  • Failed Attempts: ${req.accessCodeFailedAttempts}`, {
          x: 55,
          y: auditY,
          size: 8,
          font,
          color: rgb(0.8, 0.4, 0),
        });
        auditY -= 10;
      }

      auditY -= 5;
    }

    // ⭐ NEW: SELFIE VERIFICATION
    if (req.selfieVerification) {
      auditTrailPage.drawText(`  • Identity Verification: ✓ Selfie Captured`, {
        x: 55,
        y: auditY,
        size: 8,
        font,
        color: rgb(0, 0.6, 0),
      });
      auditY -= 10;

      const selfieCapturedAt = new Date(req.selfieVerification.capturedAt).toLocaleString();
      auditTrailPage.drawText(`    - Captured: ${selfieCapturedAt}`, {
        x: 60,
        y: auditY,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      auditY -= 10;

      if (req.selfieVerification.deviceInfo?.userAgent) {
        const deviceText = `${req.selfieVerification.deviceInfo.platform || 'Unknown device'}`;
        auditTrailPage.drawText(`    - Device: ${deviceText}`, {
          x: 60,
          y: auditY,
          size: 7,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        auditY -= 10;
      }

      auditY -= 5;
    }

    // Document activity
    if (req.viewedAt) {
      const viewedAt = new Date(req.viewedAt).toLocaleString();
      auditTrailPage.drawText(`  • Viewed: ${viewedAt}`, {
        x: 55,
        y: auditY,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      auditY -= 10;
    }

    // ⭐ NEW: Time spent (if tracked)
    if (req.timeSpentSeconds) {
      const minutes = Math.floor(req.timeSpentSeconds / 60);
      const seconds = req.timeSpentSeconds % 60;
      auditTrailPage.drawText(`  • Time Spent: ${minutes}m ${seconds}s`, {
        x: 55,
        y: auditY,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      auditY -= 10;
    }

    // IP Address and Location
    if (req.ipAddress) {
      let locationText = `  • IP: ${req.ipAddress}`;
      
      if (req.location) {
        const loc = req.location;
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


/**
 * Generate signed PDF package for envelope (multiple documents)
 */
export async function generateEnvelopeSignedPDF(
  envelopeId: string,
  signedDocuments: any[],
  recipient: any
): Promise<string> {
  try {
    console.log('📦 Generating envelope signed PDF package for:', envelopeId);

    const db = await dbPromise;
    const { ObjectId } = await import('mongodb');

    // Get envelope details
    const envelope = await db.collection('envelopes').findOne({
      envelopeId: envelopeId,
    });

    if (!envelope) {
      throw new Error('Envelope not found');
    }

    console.log(`📦 Envelope contains ${envelope.documents.length} documents`);

    // Create a new PDF for the complete package
    const packagePdf = await PDFDocument.create();
    const font = await packagePdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await packagePdf.embedFont(StandardFonts.HelveticaBold);

    // ============================================
    // 1. CREATE COVER PAGE
    // ============================================
    console.log('📄 Creating envelope cover page...');
    const coverPage = packagePdf.addPage([612, 792]); // Letter size
    let yPos = 700;

    // Header
    coverPage.drawRectangle({
      x: 0,
      y: 720,
      width: 612,
      height: 72,
      color: rgb(0.49, 0.23, 0.93), // Purple
    });

    coverPage.drawText('SIGNED DOCUMENT PACKAGE', {
      x: 50,
      y: 745,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    yPos = 650;

    // Envelope Info
    coverPage.drawText('Envelope Details', {
      x: 50,
      y: yPos,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;

    coverPage.drawText(`Envelope ID: ${envelopeId}`, {
      x: 50,
      y: yPos,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPos -= 15;

    coverPage.drawText(`Completed: ${new Date().toLocaleString()}`, {
      x: 50,
      y: yPos,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPos -= 15;

    coverPage.drawText(`Signed by: ${recipient.name} (${recipient.email})`, {
      x: 50,
      y: yPos,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPos -= 35;

    // Document List
    coverPage.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 562, y: yPos },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPos -= 25;

    coverPage.drawText('Documents in this Package', {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;

    for (let i = 0; i < envelope.documents.length; i++) {
      const doc = envelope.documents[i];
      const signedDoc = signedDocuments.find(sd => sd.documentId === doc.documentId);

      // Document number circle
      coverPage.drawCircle({
        x: 60,
        y: yPos - 5,
        size: 10,
        color: rgb(0.93, 0.90, 0.98),
        borderColor: rgb(0.49, 0.23, 0.93),
        borderWidth: 2,
      });

      coverPage.drawText(`${i + 1}`, {
        x: 57,
        y: yPos - 8,
        size: 10,
        font: boldFont,
        color: rgb(0.49, 0.23, 0.93),
      });

      // Document name
      coverPage.drawText(doc.filename, {
        x: 80,
        y: yPos - 5,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPos -= 15;

      // Status
      const statusText = signedDoc ? '✓ Signed' : '✗ Not signed';
      const statusColor = signedDoc ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
      
      coverPage.drawText(statusText, {
        x: 80,
        y: yPos - 5,
        size: 9,
        font,
        color: statusColor,
      });
      yPos -= 25;

      if (yPos < 100) {
        // Add new page if running out of space
        yPos = 700;
      }
    }

    // Security info at bottom
    yPos = 100;
    coverPage.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 562, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPos -= 15;

    coverPage.drawText('🔒 This package is digitally signed and tamper-proof', {
      x: 50,
      y: yPos,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPos -= 12;

    const crypto = require('crypto');
    const packageHash = crypto.createHash('sha256')
      .update(JSON.stringify({ envelopeId, signedDocuments }))
      .digest('hex');

    coverPage.drawText(`Package Hash: ${packageHash.substring(0, 40)}...`, {
      x: 50,
      y: yPos,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    console.log('✅ Cover page created');

    // ============================================
    // 2. PROCESS EACH DOCUMENT
    // ============================================
    for (const signedDoc of signedDocuments) {
      console.log(`📄 Processing document: ${signedDoc.filename}`);

      const document = await db.collection('documents').findOne({
        _id: new ObjectId(signedDoc.documentId),
      });

      if (!document || !document.cloudinaryPdfUrl) {
        console.warn(`⚠️ Document ${signedDoc.documentId} not found, skipping`);
        continue;
      }

      // Extract publicId from Cloudinary URL
      const urlParts = document.cloudinaryPdfUrl.split('/upload/');
      if (urlParts.length < 2) {
        console.error('Invalid Cloudinary URL format');
        continue;
      }

      const afterUpload = urlParts[1];
      const pathParts = afterUpload.split('/');
      pathParts.shift(); // Remove version
      let publicId = pathParts.join('/').replace('.pdf', '');
      publicId = decodeURIComponent(publicId);

      const resourceType = document.cloudinaryPdfUrl.includes('/image/upload/') ? 'image' : 'raw';

      // Generate authenticated download URL
      const downloadUrl = cloudinary.v2.utils.private_download_url(
        publicId,
        'pdf',
        {
          resource_type: resourceType,
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
      );

      // Download PDF
      const pdfResponse = await fetch(downloadUrl);
      if (!pdfResponse.ok) {
        console.error(`❌ Failed to download PDF: ${pdfResponse.status}`);
        continue;
      }

      const pdfBytes = await pdfResponse.arrayBuffer();
      const originalPdf = await PDFDocument.load(pdfBytes);

      // Add signatures to this document
      const pages = originalPdf.getPages();

      for (const signedField of signedDoc.signedFields) {
        const pageIndex = signedField.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width, height } = page.getSize();

        // Find field definition
        const fieldDef = envelope.signatureFields.find(
          (f: any) => f.id === signedField.id
        );

        if (!fieldDef) continue;

        const fieldWidth = fieldDef.width || (fieldDef.type === 'signature' ? 200 : 150);
        const fieldHeight = fieldDef.height || (fieldDef.type === 'signature' ? 60 : 40);

        const xInPoints = (fieldDef.x / 100) * width;
        const yFromTop = (fieldDef.y / 100) * height;
        const x = xInPoints - (fieldWidth / 2);
        const y = height - yFromTop - fieldHeight;

        // Draw signature
        if (fieldDef.type === 'signature' && signedField.signatureData) {
          try {
            const base64 = signedField.signatureData.replace(/^data:image\/\w+;base64,/, '');
            const imgBytes = Buffer.from(base64, 'base64');
            let image;
            if (signedField.signatureData.includes('image/png')) {
              image = await originalPdf.embedPng(imgBytes);
            } else {
              image = await originalPdf.embedJpg(imgBytes);
            }

            page.drawImage(image, {
              x: x,
              y: y,
              width: fieldWidth,
              height: fieldHeight,
            });
          } catch (err) {
            console.error('Failed to embed signature:', err);
          }
        }

        // Draw date
        if (fieldDef.type === 'date' && signedField.dateValue) {
          const textWidth = font.widthOfTextAtSize(signedField.dateValue, 11);
          page.drawText(signedField.dateValue, {
            x: x + (fieldWidth - textWidth) / 2,
            y: y + (fieldHeight / 2) - 4,
            size: 11,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // Draw text
        if (fieldDef.type === 'text' && signedField.textValue) {
          const textWidth = font.widthOfTextAtSize(signedField.textValue, 11);
          page.drawText(signedField.textValue, {
            x: x + (fieldWidth - textWidth) / 2,
            y: y + (fieldHeight / 2) - 4,
            size: 11,
            font,
            color: rgb(0, 0, 0),
          });
        }

        // Draw checkbox
        if (fieldDef.type === 'checkbox' && signedField.textValue !== undefined) {
          const isChecked = signedField.textValue === 'true';

          if (isChecked) {
            page.drawRectangle({
              x: x + 5,
              y: y + 5,
              width: 20,
              height: 20,
              borderColor: rgb(0.4, 0.2, 0.6),
              borderWidth: 2,
            });

            page.drawText('✓', {
              x: x + 8,
              y: y + 8,
              size: 16,
              font: boldFont,
              color: rgb(0.4, 0.2, 0.6),
            });
          } else {
            page.drawRectangle({
              x: x + 5,
              y: y + 5,
              width: 20,
              height: 20,
              borderColor: rgb(0.6, 0.6, 0.6),
              borderWidth: 2,
            });
          }

          if (fieldDef.label) {
            page.drawText(fieldDef.label, {
              x: x + 30,
              y: y + 10,
              size: 10,
              font,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      // Copy all pages from this document to package
      const copiedPages = await packagePdf.copyPages(originalPdf, originalPdf.getPageIndices());
      copiedPages.forEach(page => packagePdf.addPage(page));

      console.log(`✅ Added ${copiedPages.length} pages from ${signedDoc.filename}`);
    }

    // ============================================
    // 3. ADD AUDIT TRAIL PAGE
    // ============================================
    console.log('🧾 Creating audit trail page...');
    let auditPage = packagePdf.addPage([612, 792]);
    let auditY = 720;

    // Header
    auditPage.drawRectangle({
      x: 0,
      y: auditY,
      width: 612,
      height: 50,
      color: rgb(0.49, 0.23, 0.93),
    });

    auditPage.drawText('ENVELOPE AUDIT TRAIL', {
      x: 50,
      y: auditY + 18,
      size: 18,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    auditY = 650;

    // Envelope metadata
    auditPage.drawText(`Envelope ID: ${envelopeId}`, {
      x: 50,
      y: auditY,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    auditY -= 15;

    auditPage.drawText(`Completed: ${new Date().toLocaleString()}`, {
      x: 50,
      y: auditY,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    auditY -= 15;

    auditPage.drawText(`Total Documents: ${envelope.documents.length}`, {
      x: 50,
      y: auditY,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    auditY -= 30;

    // Signer section
    auditPage.drawLine({
      start: { x: 50, y: auditY },
      end: { x: 562, y: auditY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    auditY -= 20;

    auditPage.drawText('SIGNER INFORMATION', {
      x: 50,
      y: auditY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    auditY -= 20;

    auditPage.drawText(`Name: ${recipient.name}`, {
      x: 50,
      y: auditY,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    auditY -= 15;

    auditPage.drawText(`Email: ${recipient.email}`, {
      x: 50,
      y: auditY,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    auditY -= 15;

    if (recipient.completedAt) {
      auditPage.drawText(`Completed: ${new Date(recipient.completedAt).toLocaleString()}`, {
        x: 50,
        y: auditY,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      auditY -= 15;
    }

    if (recipient.viewedAt) {
      auditPage.drawText(`First Viewed: ${new Date(recipient.viewedAt).toLocaleString()}`, {
        x: 50,
        y: auditY,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      auditY -= 15;
    }

    auditY -= 15;

    // Document signing details
    auditPage.drawLine({
      start: { x: 50, y: auditY },
      end: { x: 562, y: auditY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    auditY -= 20;

    auditPage.drawText('DOCUMENT SIGNATURES', {
      x: 50,
      y: auditY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    auditY -= 20;

    for (let i = 0; i < signedDocuments.length; i++) {
      const signedDoc = signedDocuments[i];
      const envDoc = envelope.documents.find((d: any) => d.documentId === signedDoc.documentId);

      auditPage.drawText(`${i + 1}. ${signedDoc.filename}`, {
        x: 50,
        y: auditY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      auditY -= 15;

      auditPage.drawText(`   • Signed: ${new Date(signedDoc.signedAt).toLocaleString()}`, {
        x: 55,
        y: auditY,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      auditY -= 12;

      auditPage.drawText(`   • Fields Completed: ${signedDoc.signedFields.length}`, {
        x: 55,
        y: auditY,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      auditY -= 20;

      if (auditY < 100) {
        auditPage = packagePdf.addPage([612, 792]);
        auditY = 720;
      }
    }

    // Security footer
    auditY = 80;
    auditPage.drawLine({
      start: { x: 50, y: auditY },
      end: { x: 562, y: auditY },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    auditY -= 15;

    auditPage.drawText('This envelope was signed electronically and is legally binding.', {
      x: 50,
      y: auditY,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    auditY -= 12;

    auditPage.drawText(`Package Hash: ${packageHash}`, {
      x: 50,
      y: auditY,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    console.log('✅ Audit trail page created');

    // ============================================
    // 4. SAVE AND UPLOAD
    // ============================================
    const packagePdfBytes = await packagePdf.save();
    console.log('💾 Package PDF generated, size:', packagePdfBytes.byteLength, 'bytes');

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'signed_envelopes',
          resource_type: 'image',
          public_id: `envelope_${envelopeId}_${Date.now()}`,
          type: 'upload',
          format: 'pdf',
          overwrite: true,
          invalidate: true,
          access_mode: 'public',
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Upload successful');
            resolve(result);
          }
        }
      );

      uploadStream.end(Buffer.from(packagePdfBytes));
    });

    const signedUrl = uploadResult.secure_url.replace(/\s+/g, '');
    console.log('🔗 Signed envelope PDF URL:', signedUrl);

    return signedUrl;

  } catch (error) {
    console.error('❌ Error generating envelope signed PDF:', error);
    throw error;
  }
}