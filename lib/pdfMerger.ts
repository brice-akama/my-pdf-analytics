// lib/pdfMerger.ts
import { PDFDocument } from 'pdf-lib';

interface AttachmentFile {
  url: string;
  filename: string;
  fileType: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

/**
 * Merges the main signed PDF with all attachment files
 * @param mainPdfUrl - URL of the signed document
 * @param attachments - Array of attachment files
 * @returns Merged PDF as Uint8Array
 */
export async function mergePDFWithAttachments(
  mainPdfUrl: string,
  attachments: AttachmentFile[]
): Promise<Uint8Array> {
  try {
    console.log('🔄 Starting PDF merge process...');
    
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // 1. Load and add the main signed PDF
    console.log('📄 Loading main signed PDF...');
    const mainPdfResponse = await fetch(mainPdfUrl);
    const mainPdfBytes = await mainPdfResponse.arrayBuffer();
    const mainPdf = await PDFDocument.load(mainPdfBytes);
    
    const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
    mainPages.forEach(page => mergedPdf.addPage(page));
    
    console.log(`✅ Added ${mainPages.length} pages from main document`);

    // 2. Add a separator page if there are attachments
    if (attachments.length > 0) {
      const separatorPage = mergedPdf.addPage();
      const { width, height } = separatorPage.getSize();
      
      separatorPage.drawText('ATTACHMENTS', {
        x: 50,
        y: height - 100,
        size: 28,
      });
      
      separatorPage.drawText(
        'The following pages contain supporting documents uploaded by signers.',
        {
          x: 50,
          y: height - 150,
          size: 12,
        }
      );
      
      separatorPage.drawText(
        `Total Attachments: ${attachments.length}`,
        {
          x: 50,
          y: height - 180,
          size: 12,
        }
      );

      // Draw a line
      separatorPage.drawLine({
        start: { x: 50, y: height - 200 },
        end: { x: width - 50, y: height - 200 },
        thickness: 2,
      });
    }

    // 3. Process each attachment
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      console.log(`📎 Processing attachment ${i + 1}/${attachments.length}: ${attachment.filename}`);

      try {
        if (attachment.fileType === 'application/pdf') {
          // Handle PDF attachments - append all pages
          const attachmentResponse = await fetch(attachment.url);
          const attachmentBytes = await attachmentResponse.arrayBuffer();
          const attachmentPdf = await PDFDocument.load(attachmentBytes);
          
          // Add header page for this attachment
          const headerPage = mergedPdf.addPage();
          const { width, height } = headerPage.getSize();
          
          headerPage.drawText(`Attachment ${i + 1}: ${attachment.filename}`, {
            x: 50,
            y: height - 100,
            size: 16,
          });
          
          if (attachment.uploadedBy) {
            headerPage.drawText(`Uploaded by: ${attachment.uploadedBy}`, {
              x: 50,
              y: height - 130,
              size: 10,
            });
          }
          
          if (attachment.uploadedAt) {
            headerPage.drawText(
              `Date: ${new Date(attachment.uploadedAt).toLocaleString()}`,
              {
                x: 50,
                y: height - 150,
                size: 10,
              }
            );
          }

          // Copy all pages from the attachment PDF
          const attachmentPages = await mergedPdf.copyPages(
            attachmentPdf,
            attachmentPdf.getPageIndices()
          );
          
          attachmentPages.forEach(page => mergedPdf.addPage(page));
          console.log(`✅ Added ${attachmentPages.length} pages from ${attachment.filename}`);

        } else if (attachment.fileType.startsWith('image/')) {
          // Handle image attachments - convert to PDF page
          const imageResponse = await fetch(attachment.url);
          const imageBytes = await imageResponse.arrayBuffer();
          
          let embeddedImage;
          if (attachment.fileType === 'image/png') {
            embeddedImage = await mergedPdf.embedPng(imageBytes);
          } else if (
            attachment.fileType === 'image/jpeg' || 
            attachment.fileType === 'image/jpg'
          ) {
            embeddedImage = await mergedPdf.embedJpg(imageBytes);
          } else {
            console.warn(`⚠️ Unsupported image type: ${attachment.fileType}`);
            continue;
          }

          // Create a page sized to fit the image (scale if too large)
          const imageDims = embeddedImage.scale(1);
          const maxWidth = 595; // A4 width in points
          const maxHeight = 842; // A4 height in points
          
          let imageWidth = imageDims.width;
          let imageHeight = imageDims.height;
          
          // Scale down if image is larger than A4
          if (imageWidth > maxWidth || imageHeight > maxHeight) {
            const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
            imageWidth *= scale;
            imageHeight *= scale;
          }

          const page = mergedPdf.addPage([maxWidth, maxHeight]);
          
          // Center the image on the page
          const x = (maxWidth - imageWidth) / 2;
          const y = (maxHeight - imageHeight) / 2;
          
          page.drawImage(embeddedImage, {
            x,
            y,
            width: imageWidth,
            height: imageHeight,
          });

          // Add caption
          page.drawText(`Attachment: ${attachment.filename}`, {
            x: 50,
            y: 30,
            size: 10,
          });

          console.log(`✅ Added image: ${attachment.filename}`);

        } else {
          // For Word/Excel/other files, add a reference page
          console.warn(
            `⚠️ Cannot embed ${attachment.fileType} directly. Adding reference page.`
          );
          
          const refPage = mergedPdf.addPage();
          const { height: refHeight } = refPage.getSize();
          
          refPage.drawText(`Attachment ${i + 1}: ${attachment.filename}`, {
            x: 50,
            y: refHeight - 100,
            size: 16,
          });
          
          refPage.drawText('This file type cannot be embedded directly in PDF.', {
            x: 50,
            y: refHeight - 150,
            size: 12,
          });
          
          refPage.drawText(`File Type: ${attachment.fileType}`, {
            x: 50,
            y: refHeight - 180,
            size: 10,
          });
          
          refPage.drawText(
            'Please download this file separately from the signature portal.',
            {
              x: 50,
              y: refHeight - 210,
              size: 10,
            }
          );
          
          if (attachment.uploadedBy) {
            refPage.drawText(`Uploaded by: ${attachment.uploadedBy}`, {
              x: 50,
              y: refHeight - 240,
              size: 10,
            });
          }
        }

      } catch (err) {
        console.error(`❌ Failed to process attachment: ${attachment.filename}`, err);
        // Continue with other attachments even if one fails
      }
    }

    // 4. Add metadata
    mergedPdf.setTitle('Signed Document with Attachments');
    mergedPdf.setSubject('E-Signature Document Package');
    mergedPdf.setCreator('DocSend Platform');
    mergedPdf.setProducer('DocSend E-Signature Service');
    mergedPdf.setCreationDate(new Date());

    // 5. Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    console.log(`✅ Final merged PDF created: ${(mergedPdfBytes.length / 1024 / 1024).toFixed(2)} MB`);

    return mergedPdfBytes;

  } catch (error) {
    console.error('❌ Error merging PDF with attachments:', error);
    throw new Error('Failed to merge PDF with attachments');
  }
}

/**
 * Add page numbers to merged PDF
 */
export async function addPageNumbers(pdfBytes: Uint8Array): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width } = page.getSize();
      page.drawText(`Page ${index + 1} of ${totalPages}`, {
        x: width / 2 - 30,
        y: 15,
        size: 9,
      });
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error('❌ Error adding page numbers:', error);
    return pdfBytes; // Return original if page numbering fails
  }
}