// lib/pdfGenerator.ts
// lib/pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import cloudinary from 'cloudinary';
import { dbPromise } from '@/app/api/lib/mongodb';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE CONSTANTS — must match editor (StepTwo.tsx) and sign page exactly
// Editor saves x as % of 794px width, y as % of 1122px (297mm × 3.78) height
// ─────────────────────────────────────────────────────────────────────────────
const EDITOR_W_PX = 794;
const EDITOR_H_PX = 297 * 3.78; // 1122px per page

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: draw a field onto a PDF page with correct coordinate conversion
// ─────────────────────────────────────────────────────────────────────────────
async function drawFieldOnPage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  field: any,
  signedField: any,
  font: PDFFont,
  boldFont: PDFFont
) {
  const { width, height } = page.getSize();

  // Scale from editor pixel space → PDF point space
  const scaleX = width  / EDITOR_W_PX;
  const scaleY = height / EDITOR_H_PX;

  const fieldWidthPt  = (field.width  ?? (field.type === 'signature' ? 150 : field.type === 'checkbox' ? 24 : 120)) * scaleX;
  const fieldHeightPt = (field.height ?? (field.type === 'signature' ? 45  : field.type === 'checkbox' ? 24 : 32))  * scaleY;

  // field.x is % of editor width → convert to PDF points from left
  const xInPoints = (field.x / 100) * width;
  // field.y is % of editor page height → convert to PDF points from top
  const yFromTopPt = (field.y / 100) * height;

  // Center the field horizontally on the anchor point
  const x = xInPoints - (fieldWidthPt / 2);
  // PDF coordinate system is bottom-up, so flip Y
  const y = height - yFromTopPt - fieldHeightPt;

  // ── SIGNATURE IMAGE ────────────────────────────────────────────────────────
  if (field.type === 'signature' && signedField.signatureData) {
    try {
      const base64 = signedField.signatureData.replace(/^data:image\/\w+;base64,/, '');
      const imgBytes = Buffer.from(base64, 'base64');
      const image = signedField.signatureData.includes('image/png')
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);
      page.drawImage(image, { x, y, width: fieldWidthPt, height: fieldHeightPt });
    } catch (err) {
      console.error('Failed to embed signature image:', err);
      page.drawText('Signed', {
        x: x + 10,
        y: y + fieldHeightPt / 2 - 7,
        size: 12 * scaleY,
        font,
        color: rgb(0.2, 0.2, 0.8),
      });
    }
  }

  // ── DATE FIELD ─────────────────────────────────────────────────────────────
  if (field.type === 'date' && signedField.dateValue) {
    const fontSize = 9 * scaleY;
    const textWidth = font.widthOfTextAtSize(signedField.dateValue, fontSize);
    page.drawText(signedField.dateValue, {
      x: x + (fieldWidthPt - textWidth) / 2,
      y: y + fieldHeightPt / 2 - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // ── TEXT FIELD ─────────────────────────────────────────────────────────────
  if (field.type === 'text' && signedField.textValue) {
    const fontSize = 9 * scaleY;
    const textWidth = font.widthOfTextAtSize(signedField.textValue, fontSize);
    page.drawText(signedField.textValue, {
      x: x + (fieldWidthPt - textWidth) / 2,
      y: y + fieldHeightPt / 2 - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // ── CHECKBOX FIELD ─────────────────────────────────────────────────────────
  if (field.type === 'checkbox' && signedField.textValue !== undefined) {
    const isChecked = signedField.textValue === 'true';
    const boxSize = Math.min(fieldWidthPt, fieldHeightPt) * 0.8;
    const boxX = x + (fieldWidthPt - boxSize) / 2;
    const boxY = y + (fieldHeightPt - boxSize) / 2;

    page.drawRectangle({
      x: boxX, y: boxY,
      width: boxSize, height: boxSize,
      borderColor: isChecked ? rgb(0.4, 0.2, 0.6) : rgb(0.6, 0.6, 0.6),
      borderWidth: 1.5,
    });

    if (isChecked) {
      const checkSize = boxSize * 0.65;
      page.drawText('X', {
        x: boxX + (boxSize - checkSize * 0.6) / 2,
        y: boxY + (boxSize - checkSize) / 2,
        size: checkSize,
        font: boldFont,
        color: rgb(0.4, 0.2, 0.6),
      });
    }

    if (field.label) {
      page.drawText(field.label, {
        x: x + fieldWidthPt + 4 * scaleX,
        y: y + fieldHeightPt / 2 - 4 * scaleY,
        size: 8 * scaleY,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // ── DROPDOWN FIELD ─────────────────────────────────────────────────────────
  if (field.type === 'dropdown' && signedField.textValue) {
    const fontSize = 9 * scaleY;
    const textWidth = font.widthOfTextAtSize(signedField.textValue, fontSize);
    page.drawText(signedField.textValue, {
      x: x + (fieldWidthPt - textWidth) / 2,
      y: y + fieldHeightPt / 2 - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // ── RADIO BUTTON FIELD ─────────────────────────────────────────────────────
  if (field.type === 'radio' && signedField.textValue) {
    const selectedValue = signedField.textValue;
    if (field.label) {
      page.drawText(field.label, {
        x: x + 4 * scaleX,
        y: y + fieldHeightPt - 12 * scaleY,
        size: 8 * scaleY,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    }
    let optionY = y + fieldHeightPt - 28 * scaleY;
    const radioR = 4 * scaleY;
    const lineH  = 14 * scaleY;
    (field.options ?? []).forEach((option: string) => {
      const isSelected = option === selectedValue;
      page.drawCircle({
        x: x + 10 * scaleX,
        y: optionY + radioR,
        size: radioR,
        borderColor: rgb(0.4, 0.2, 0.6),
        borderWidth: 1.2,
      });
      if (isSelected) {
        page.drawCircle({
          x: x + 10 * scaleX,
          y: optionY + radioR,
          size: radioR * 0.5,
          color: rgb(0.4, 0.2, 0.6),
        });
      }
      page.drawText(option, {
        x: x + 18 * scaleX,
        y: optionY,
        size: 7 * scaleY,
        font: isSelected ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      optionY -= lineH;
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL CERTIFICATE PAGE — DocSend/DocuSign style
// ─────────────────────────────────────────────────────────────────────────────
async function addCertificatePage(
  pdfDoc: PDFDocument,
  documentId: string,
  documentName: string,
  originalPageCount: number,
  signatureRequests: any[],
  documentHash: string
): Promise<void> {
  const PAGE_W = 612;
  const PAGE_H = 792;

  // ── Colors ──────────────────────────────────────────────────────────────────
  const PURPLE      = rgb(0.49, 0.23, 0.93);
  const PURPLE_LIGHT = rgb(0.93, 0.88, 0.99);
  const DARK        = rgb(0.08, 0.08, 0.12);
  const MEDIUM      = rgb(0.35, 0.35, 0.42);
  const LIGHT       = rgb(0.62, 0.62, 0.68);
  const WHITE       = rgb(1, 1, 1);
  const GREEN       = rgb(0.13, 0.69, 0.30);
  const BORDER      = rgb(0.88, 0.88, 0.92);
  const BG_LIGHT    = rgb(0.97, 0.97, 0.99);

  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  // ── Helper: add new page when running low ──────────────────────────────────
  const ensureSpace = (needed: number) => {
    if (y - needed < 40) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 30;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HEADER BAND
  // ══════════════════════════════════════════════════════════════════════════
  page.drawRectangle({ x: 0, y: PAGE_H - 72, width: PAGE_W, height: 72, color: DARK });

  // DocMetrics logo area
  page.drawRectangle({ x: 30, y: PAGE_H - 54, width: 32, height: 32,
    color: PURPLE, });
  page.drawText('DM', { x: 38, y: PAGE_H - 44, size: 13, font: boldFont, color: WHITE });

  page.drawText('DocMetrics', { x: 70, y: PAGE_H - 38, size: 14, font: boldFont, color: WHITE });
  page.drawText('e-Signature Platform', { x: 70, y: PAGE_H - 52, size: 8, font, color: rgb(0.7, 0.7, 0.8) });

  // "Certificate" top-right
  page.drawText('Certificate of Completion', {
    x: PAGE_W - 175, y: PAGE_H - 42, size: 13, font: boldFont, color: WHITE,
  });
  page.drawText('Legally Binding Electronic Signature Record', {
    x: PAGE_W - 175, y: PAGE_H - 56, size: 7, font, color: rgb(0.7, 0.7, 0.8),
  });

  y = PAGE_H - 72;

  // ── Green "Completed" banner ────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: y - 28, width: PAGE_W, height: 28, color: rgb(0.06, 0.60, 0.25) });
  page.drawText(' ALL SIGNATURES COLLECTED — DOCUMENT FULLY EXECUTED', {
    x: 30, y: y - 19, size: 8, font: boldFont, color: WHITE,
  });
  page.drawText(`Completed: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}`, {
    x: PAGE_W - 240, y: y - 19, size: 7, font, color: WHITE,
  });
  y -= 28;

  // ── Section: Document Details ───────────────────────────────────────────────
  y -= 18;
  page.drawText('DOCUMENT DETAILS', { x: 30, y, size: 7.5, font: boldFont, color: PURPLE });
  y -= 4;
  page.drawLine({ start: { x: 30, y }, end: { x: PAGE_W - 30, y }, thickness: 0.5, color: BORDER });
  y -= 14;

  // Two-column grid
  const col1x = 30;
  const col2x = 320;
  const labelSize = 7;
  const valueSize = 9;
  const rowH = 22;

  const drawRow = (label: string, value: string, cx: number, cy: number) => {
    page.drawText(label.toUpperCase(), { x: cx, y: cy + 9, size: labelSize, font, color: LIGHT });
    page.drawText(value || '—', { x: cx, y: cy, size: valueSize, font: boldFont, color: DARK });
  };

  drawRow('Document Name', documentName, col1x, y);
  drawRow('Document ID', documentId, col2x, y);
  y -= rowH;

  drawRow('Total Pages', `${originalPageCount} page${originalPageCount !== 1 ? 's' : ''}`, col1x, y);
  drawRow('Completed On', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), col2x, y);
  y -= rowH;

  drawRow('Signatures Required', `${signatureRequests.length}`, col1x, y);
  drawRow('Signatures Collected', `${signatureRequests.filter(r => r.status === 'signed').length}`, col2x, y);
  y -= rowH + 6;

  // ── Document hash fingerprint ───────────────────────────────────────────────
  page.drawRectangle({ x: 30, y: y - 22, width: PAGE_W - 60, height: 22, color: BG_LIGHT, });
  page.drawText('SHA-256 DOCUMENT FINGERPRINT', { x: 36, y: y - 9, size: 6.5, font: boldFont, color: LIGHT });
  page.drawText(documentHash, { x: 36, y: y - 18, size: 6.5, font, color: MEDIUM });
  y -= 36;

  // ══════════════════════════════════════════════════════════════════════════
  // SIGNER RECORDS (one card per signer)
  // ══════════════════════════════════════════════════════════════════════════
  y -= 6;
  page.drawText('SIGNER RECORDS', { x: 30, y, size: 7.5, font: boldFont, color: PURPLE });
  y -= 4;
  page.drawLine({ start: { x: 30, y }, end: { x: PAGE_W - 30, y }, thickness: 0.5, color: BORDER });
  y -= 10;

  for (let ri = 0; ri < signatureRequests.length; ri++) {
    const req = signatureRequests[ri];
    if (req.status !== 'signed') continue;

    const cardH = 170; // estimated height for one signer card
    ensureSpace(cardH);

    // Card background
    page.drawRectangle({
      x: 30, y: y - cardH + 10, width: PAGE_W - 60, height: cardH,
      color: WHITE,
      borderColor: BORDER, borderWidth: 0.75,
    });

    // Card header strip
    page.drawRectangle({
      x: 30, y: y - 22 + 10, width: PAGE_W - 60, height: 22,
      color: PURPLE_LIGHT, 
    });

    // Signer number circle
    page.drawCircle({ x: 48, y: y - 10 + 10, size: 10, color: PURPLE });
    page.drawText(`${ri + 1}`, { x: ri < 9 ? 45 : 43, y: y - 15 + 10, size: 9, font: boldFont, color: WHITE });

    page.drawText(req.recipient?.name || 'Unknown', {
      x: 62, y: y - 8 + 10, size: 10, font: boldFont, color: DARK,
    });
    page.drawText(req.recipient?.email || '', {
      x: 62, y: y - 18 + 10, size: 7.5, font, color: MEDIUM,
    });

    // "SIGNED" badge
    page.drawRectangle({ x: PAGE_W - 95, y: y - 20 + 10, width: 55, height: 16, color: GREEN, });
    page.drawText(' SIGNED', { x: PAGE_W - 87, y: y - 13 + 10, size: 7.5, font: boldFont, color: WHITE });

    y -= 22;

    // ── Two-column signer details ───────────────────────────────────────────
    const sc1 = 38;
    const sc2 = 320;
    const sr  = 20;

    const drawSignerRow = (label: string, value: string, cx: number, cy: number) => {
      page.drawText(label.toUpperCase(), { x: cx, y: cy + 8, size: 6.5, font, color: LIGHT });
      page.drawText(value || '—', { x: cx, y: cy, size: 8.5, font: boldFont, color: DARK });
    };

    // Signed at
    const signedAt = req.signedAt
      ? new Date(req.signedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'long' })
      : '—';
    drawSignerRow('Signed', signedAt, sc1, y);

    // Viewed at
    const viewedAt = req.viewedAt
      ? new Date(req.viewedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : '—';
    drawSignerRow('Document Viewed', viewedAt, sc2, y);
    y -= sr;

    // IP + location
    const ipText = req.recipient?.ipAddress || req.ipAddress || '—';
    let locationText = '—';
    const loc = req.recipient?.location || req.location;
    if (loc) {
      const parts = [loc.city, loc.region, loc.country].filter(Boolean);
      if (parts.length) locationText = parts.join(', ');
    }
    drawSignerRow('IP Address', ipText, sc1, y);
    drawSignerRow('Location', locationText, sc2, y);
    y -= sr;

    // Device / browser
    const browserParts = [
      req.recipient?.browser,
      req.recipient?.os,
      req.recipient?.deviceType,
    ].filter(Boolean);
    drawSignerRow('Device / Browser', browserParts.length ? browserParts.join(' · ') : '—', sc1, y);

    // Time spent
    if (req.timeSpentSeconds) {
      const mins = Math.floor(req.timeSpentSeconds / 60);
      const secs = req.timeSpentSeconds % 60;
      drawSignerRow('Time on Document', `${mins}m ${secs}s`, sc2, y);
    }
    y -= sr;

    // Agreement to terms
    page.drawRectangle({ x: sc1, y: y - 12, width: PAGE_W - 76, height: 14, color: rgb(0.94, 0.99, 0.95),  });
    page.drawText(
      `[AGREED] ${req.recipient?.name || 'Signer'} agreed to DocMetrics Terms & Conditions and Electronic Signature Disclosure before signing`,
      { x: sc1 + 4, y: y - 7, size: 6.5, font, color: rgb(0.1, 0.5, 0.2) }
    );
    y -= 18;

    // Which pages were signed
    const sigPages = [...new Set(
      (req.signatureFields ?? [])
        .filter((f: any) => req.signedFields?.find((sf: any) => sf.id === f.id))
        .map((f: any) => f.page)
    )].sort();
    if (sigPages.length) {
      page.drawText(`Signature fields on page${sigPages.length > 1 ? 's' : ''}: ${sigPages.join(', ')}`, {
        x: sc1, y, size: 7, font, color: MEDIUM,
      });
      y -= 14;
    }

    // ── Access code verification ────────────────────────────────────────────
    if (req.accessCodeRequired) {
      const verifiedText = req.accessCodeVerifiedAt
        ? `Verified ${new Date(req.accessCodeVerifiedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`
        : 'Not verified';
      const codeType = req.accessCodeType === 'custom'
        ? 'Custom code'
        : (req.accessCodeType ?? '').replace(/_/g, ' ');
      page.drawText(` Access Code Auth: ${verifiedText}  |  Type: ${codeType}${req.accessCodeFailedAttempts > 0 ? `  |  Failed attempts: ${req.accessCodeFailedAttempts}` : ''}`,
        { x: sc1, y, size: 7, font, color: MEDIUM });
      y -= 12;
    }

    // ── Selfie / identity verification ─────────────────────────────────────
    if (req.selfieVerification) {
      const capAt = req.selfieVerification.capturedAt
        ? new Date(req.selfieVerification.capturedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        : '';
      page.drawText(` Identity Verified: Selfie captured ${capAt}  |  Device: ${req.selfieVerification.deviceInfo?.platform || 'Unknown'}`,
        { x: sc1, y, size: 7, font, color: MEDIUM });
      y -= 12;
    }

    // ── Inline signature image ──────────────────────────────────────────────
    const sigField = req.signedFields?.find((sf: any) => sf.type === 'signature' && sf.signatureData);
    if (sigField?.signatureData) {
      try {
        const base64 = sigField.signatureData.replace(/^data:image\/\w+;base64,/, '');
        const imgBytes = Buffer.from(base64, 'base64');
        const image = sigField.signatureData.includes('image/png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        const sigW = 160;
        const sigH = 50;
        page.drawText('SIGNATURE', { x: sc1, y, size: 6.5, font: boldFont, color: LIGHT });
        y -= 4;
        page.drawRectangle({ x: sc1, y: y - sigH, width: sigW, height: sigH,
          borderColor: BORDER, borderWidth: 0.5, color: WHITE });
        page.drawImage(image, { x: sc1 + 4, y: y - sigH + 4, width: sigW - 8, height: sigH - 8 });
        y -= sigH + 6;
      } catch (e) {
        // skip if image fails
      }
    }

    y -= 12; // gap between signer cards
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER — legal statement + hash
  // ══════════════════════════════════════════════════════════════════════════
  ensureSpace(50);
  y -= 8;
  page.drawLine({ start: { x: 30, y }, end: { x: PAGE_W - 30, y }, thickness: 0.5, color: BORDER });
  y -= 12;

  page.drawText(
    'This certificate constitutes a legally binding electronic signature record in accordance with the Electronic Signatures in',
    { x: 30, y, size: 6.5, font, color: LIGHT }
  );
  y -= 10;
  page.drawText(
    'Global and National Commerce Act (ESIGN), the Uniform Electronic Transactions Act (UETA), and eIDAS (EU) No 910/2014.',
    { x: 30, y, size: 6.5, font, color: LIGHT }
  );
  y -= 10;
  page.drawText(
    `Document fingerprint: ${documentHash}  |  Issued by DocMetrics e-Signature Platform  |  ${new Date().toISOString()}`,
    { x: 30, y, size: 5.5, font, color: rgb(0.75, 0.75, 0.78) }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: generateSignedPDF
// ─────────────────────────────────────────────────────────────────────────────
export async function generateSignedPDF(
  documentId: string,
  signatureRequests: any[]
): Promise<string> {
  try {
    console.log(' Generating signed PDF for document:', documentId);

    const db = await dbPromise;
    const { ObjectId } = await import('mongodb');
    const document = await db.collection('documents').findOne({ _id: new ObjectId(documentId) });
    if (!document || !document.cloudinaryPdfUrl) throw new Error('Original PDF not found');

    console.log('📄 Original Cloudinary URL:', document.cloudinaryPdfUrl);

    // Extract public ID
    const urlParts = document.cloudinaryPdfUrl.split('/upload/');
    if (urlParts.length < 2) throw new Error('Invalid Cloudinary URL format');
    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift();
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    const resourceType = document.cloudinaryPdfUrl.includes('/image/upload/') ? 'image' : 'raw';

    const downloadUrl = cloudinary.v2.utils.private_download_url(publicId, 'pdf', {
      resource_type: resourceType, type: 'upload',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    const pdfResponse = await fetch(downloadUrl);
    if (!pdfResponse.ok) throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
    const pdfBytes = await pdfResponse.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages  = pdfDoc.getPages();
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const originalPageCount = pages.length;

    console.log(' PDF Pages:', originalPageCount);

    // ── Draw all signature fields ────────────────────────────────────────────
    for (const request of signatureRequests) {
      if (request.status !== 'signed' || !request.signedFields) continue;

      for (const field of request.signatureFields) {
        const signedField = request.signedFields.find((sf: any) => sf.id === field.id);
        if (!signedField) continue;

        const pageIndex = field.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        await drawFieldOnPage(pages[pageIndex], pdfDoc, field, signedField, font, boldFont);
      }
    }

    // ── Document hash ────────────────────────────────────────────────────────
    const crypto = require('crypto');
    const documentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(signatureRequests))
      .digest('hex');

    // ── Professional Certificate (replaces old audit trail) ──────────────────
    await addCertificatePage(
      pdfDoc,
      documentId,
      document.filename || 'Document',
      originalPageCount,
      signatureRequests,
      documentHash
    );

    console.log(' Certificate page added');

    // ── Save signed PDF ──────────────────────────────────────────────────────
    const signedPdfBytes = await pdfDoc.save();
    console.log(' Signed PDF generated, size:', signedPdfBytes.byteLength);

    // ── Merge attachments ────────────────────────────────────────────────────
    const attachments = await db.collection('signature_attachments')
      .find({ documentId })
      .sort({ uploadedAt: 1 })
      .toArray();

    let finalPdfBytes: Uint8Array;

    if (attachments.length > 0) {
      try {
        const mergedPdf = await PDFDocument.load(signedPdfBytes);
        const sepPage = mergedPdf.addPage();
        const { width: sw, height: sh } = sepPage.getSize();
        sepPage.drawRectangle({ x: 0, y: sh - 80, width: sw, height: 80, color: rgb(0.08, 0.08, 0.12) });
        sepPage.drawText('ATTACHMENTS', { x: 50, y: sh - 48, size: 26, font: boldFont, color: rgb(1,1,1) });
        sepPage.drawText('Supporting documents uploaded by signers', { x: 50, y: sh - 64, size: 11, font, color: rgb(0.7,0.7,0.8) });
        sepPage.drawText(`Total: ${attachments.length}`, { x: 50, y: sh - 110, size: 11, font, color: rgb(0,0,0) });

        for (let i = 0; i < attachments.length; i++) {
          const att = attachments[i];
          try {
            if (att.fileType === 'application/pdf') {
              const attUrl = cloudinary.v2.utils.private_download_url(att.cloudinaryPublicId, 'pdf', {
                resource_type: 'image', type: 'upload',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              });
              const attResp = await fetch(attUrl);
              if (!attResp.ok) continue;
              const attBytes = await attResp.arrayBuffer();
              const attPdf = await PDFDocument.load(attBytes);
              const hdrPage = mergedPdf.addPage();
              const { height: hh } = hdrPage.getSize();
              hdrPage.drawText(`Attachment ${i + 1}: ${att.filename}`, { x: 50, y: hh - 100, size: 16, font: boldFont });
              if (att.recipientName) hdrPage.drawText(`Uploaded by: ${att.recipientName}`, { x: 50, y: hh - 125, size: 10, font });
              if (att.uploadedAt) hdrPage.drawText(`Date: ${new Date(att.uploadedAt).toLocaleString()}`, { x: 50, y: hh - 145, size: 10, font });
              const copied = await mergedPdf.copyPages(attPdf, attPdf.getPageIndices());
              copied.forEach(p => mergedPdf.addPage(p));
            } else if (att.fileType.startsWith('image/')) {
              const imgUrl = cloudinary.v2.utils.private_download_url(att.cloudinaryPublicId, '', {
                resource_type: 'image', type: 'upload',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              });
              const imgResp = await fetch(imgUrl);
              if (!imgResp.ok) continue;
              const imgBytes = await imgResp.arrayBuffer();
              let embeddedImg;
              if (att.fileType === 'image/png') embeddedImg = await mergedPdf.embedPng(imgBytes);
              else if (att.fileType.match(/jpe?g/)) embeddedImg = await mergedPdf.embedJpg(imgBytes);
              else continue;
              const dims = embeddedImg.scale(1);
              const maxW = 495, maxH = 742;
              let iw = dims.width, ih = dims.height;
              if (iw > maxW || ih > maxH) {
                const s = Math.min(maxW / iw, maxH / ih);
                iw *= s; ih *= s;
              }
              const imgPage = mergedPdf.addPage([595, 842]);
              imgPage.drawImage(embeddedImg, { x: (595 - iw) / 2, y: (842 - ih) / 2, width: iw, height: ih });
              imgPage.drawText(`Attachment: ${att.filename}`, { x: 50, y: 25, size: 9, font });
            }
          } catch (e) {
            console.error(`Failed to process attachment ${att.filename}:`, e);
          }
        }

        finalPdfBytes = await mergedPdf.save();
      } catch (e) {
        console.error('Failed to merge attachments:', e);
        finalPdfBytes = signedPdfBytes;
      }
    } else {
      finalPdfBytes = signedPdfBytes;
    }

    // ── Upload to Cloudinary ─────────────────────────────────────────────────
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'signed_documents',
          resource_type: 'image',
          public_id: `signed_${documentId.replace(/\n/g, '')}_${Date.now()}`,
          type: 'upload', format: 'pdf',
          overwrite: true, invalidate: true, access_mode: 'public',
        },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(Buffer.from(finalPdfBytes));
    });

    const signedUrl = uploadResult.secure_url.replace(/\s+/g, '');
    console.log(' Signed PDF URL:', signedUrl);
    return signedUrl;

  } catch (error) {
    console.error(' Error generating signed PDF:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVELOPE: generateEnvelopeSignedPDF
// ─────────────────────────────────────────────────────────────────────────────
export async function generateEnvelopeSignedPDF(
  envelopeId: string,
  signedDocuments: any[],
  recipient: any
): Promise<string> {
  try {
    console.log(' Generating envelope signed PDF package for:', envelopeId);

    const db = await dbPromise;
    const { ObjectId } = await import('mongodb');

    const envelope = await db.collection('envelopes').findOne({ envelopeId });
    if (!envelope) throw new Error('Envelope not found');

    const packagePdf = await PDFDocument.create();
    const font     = await packagePdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await packagePdf.embedFont(StandardFonts.HelveticaBold);

    // ── COVER PAGE ────────────────────────────────────────────────────────────
    const coverPage = packagePdf.addPage([612, 792]);
    let yPos = 792;

    coverPage.drawRectangle({ x: 0, y: yPos - 80, width: 612, height: 80, color: rgb(0.08, 0.08, 0.12) });
    coverPage.drawRectangle({ x: 30, y: yPos - 62, width: 36, height: 36, color: rgb(0.49, 0.23, 0.93), });
    coverPage.drawText('DM', { x: 39, y: yPos - 48, size: 14, font: boldFont, color: rgb(1,1,1) });
    coverPage.drawText('DocMetrics', { x: 74, y: yPos - 45, size: 15, font: boldFont, color: rgb(1,1,1) });
    coverPage.drawText('Signed Document Package', { x: 74, y: yPos - 59, size: 9, font, color: rgb(0.7,0.7,0.8) });
    coverPage.drawText('ENVELOPE', { x: 612 - 100, y: yPos - 50, size: 20, font: boldFont, color: rgb(0.49,0.23,0.93) });
    yPos -= 80;

    coverPage.drawRectangle({ x: 0, y: yPos - 24, width: 612, height: 24, color: rgb(0.13, 0.69, 0.30) });
    coverPage.drawText(' ALL DOCUMENTS SIGNED AND EXECUTED', { x: 30, y: yPos - 16, size: 9, font: boldFont, color: rgb(1,1,1) });
    yPos -= 24;

    yPos -= 24;
    coverPage.drawText('ENVELOPE DETAILS', { x: 30, y: yPos, size: 8, font: boldFont, color: rgb(0.49,0.23,0.93) });
    yPos -= 5;
    coverPage.drawLine({ start: { x: 30, y: yPos }, end: { x: 582, y: yPos }, thickness: 0.5, color: rgb(0.88,0.88,0.92) });
    yPos -= 16;

    const envRows = [
      ['Envelope ID', envelopeId],
      ['Completed', new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })],
      ['Signed by', `${recipient.name} (${recipient.email})`],
      ['Documents', `${envelope.documents.length}`],
    ];
    for (const [label, value] of envRows) {
      coverPage.drawText(label.toUpperCase(), { x: 30, y: yPos + 8, size: 7, font, color: rgb(0.62,0.62,0.68) });
      coverPage.drawText(value, { x: 30, y: yPos, size: 9, font: boldFont, color: rgb(0.08,0.08,0.12) });
      yPos -= 22;
    }

    yPos -= 10;
    coverPage.drawText('DOCUMENTS IN THIS PACKAGE', { x: 30, y: yPos, size: 8, font: boldFont, color: rgb(0.49,0.23,0.93) });
    yPos -= 5;
    coverPage.drawLine({ start: { x: 30, y: yPos }, end: { x: 582, y: yPos }, thickness: 0.5, color: rgb(0.88,0.88,0.92) });
    yPos -= 14;

    for (let i = 0; i < envelope.documents.length; i++) {
      const doc = envelope.documents[i];
      const signedDoc = signedDocuments.find(sd => sd.documentId === doc.documentId.toString());
      coverPage.drawCircle({ x: 44, y: yPos - 3, size: 10, color: rgb(0.49,0.23,0.93) });
      coverPage.drawText(`${i + 1}`, { x: i < 9 ? 41 : 39, y: yPos - 7, size: 9, font: boldFont, color: rgb(1,1,1) });
      coverPage.drawText(doc.filename, { x: 60, y: yPos, size: 10, font: boldFont, color: rgb(0.08,0.08,0.12) });
      const statusColor = signedDoc ? rgb(0.13,0.69,0.30) : rgb(0.8,0.3,0);
      coverPage.drawText(signedDoc ? '[SIGNED]' : '[PENDING]', { x: 60, y: yPos - 13, size: 8, font: boldFont, color: statusColor });
      yPos -= 32;
    }

    // ── PROCESS EACH DOCUMENT ─────────────────────────────────────────────────
    for (const signedDoc of signedDocuments) {
      const document = await db.collection('documents').findOne({ _id: new ObjectId(signedDoc.documentId) });
      if (!document?.cloudinaryPdfUrl) continue;

      const urlParts = document.cloudinaryPdfUrl.split('/upload/');
      if (urlParts.length < 2) continue;
      const pathParts = urlParts[1].split('/');
      pathParts.shift();
      let publicId = pathParts.join('/').replace('.pdf', '');
      publicId = decodeURIComponent(publicId);
      const resourceType = document.cloudinaryPdfUrl.includes('/image/upload/') ? 'image' : 'raw';

      const dlUrl = cloudinary.v2.utils.private_download_url(publicId, 'pdf', {
        resource_type: resourceType, type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      const pdfResp = await fetch(dlUrl);
      if (!pdfResp.ok) continue;
      const pdfBytesArr = await pdfResp.arrayBuffer();
      const originalPdf = await PDFDocument.load(pdfBytesArr);
      const docPages = originalPdf.getPages();

      for (const signedField of signedDoc.signedFields) {
        const fieldDef = envelope.signatureFields.find((f: any) => f.id === signedField.id);
        if (!fieldDef || fieldDef.documentId !== signedDoc.documentId) continue;
        const pageIndex = fieldDef.page - 1;
        if (pageIndex < 0 || pageIndex >= docPages.length) continue;
        await drawFieldOnPage(docPages[pageIndex], originalPdf, fieldDef, signedField, font, boldFont);
      }

      const copied = await packagePdf.copyPages(originalPdf, originalPdf.getPageIndices());
      copied.forEach(p => packagePdf.addPage(p));
    }

    // ── ENVELOPE CERTIFICATE ──────────────────────────────────────────────────
    const crypto = require('crypto');
    const packageHash = crypto.createHash('sha256')
      .update(JSON.stringify({ envelopeId, signedDocuments }))
      .digest('hex');

    // Build synthetic signatureRequests array for certificate
    const syntheticRequests = signedDocuments.map(sd => ({
      status: 'signed',
      recipient,
      signedAt: sd.signedAt,
      viewedAt: recipient.viewedAt,
      signedFields: sd.signedFields,
      signatureFields: envelope.signatureFields.filter((f: any) => f.documentId === sd.documentId),
    }));

    await addCertificatePage(
      packagePdf,
      envelopeId,
      `Envelope — ${envelope.documents.length} documents`,
      signedDocuments.reduce((sum: number, sd: any) => sum + (sd.numPages || 1), 0),
      syntheticRequests,
      packageHash
    );

    const packagePdfBytes = await packagePdf.save();

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'signed_envelopes',
          resource_type: 'image',
          public_id: `envelope_${envelopeId}_${Date.now()}`,
          type: 'upload', format: 'pdf',
          overwrite: true, invalidate: true, access_mode: 'public',
        },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(Buffer.from(packagePdfBytes));
    });

    const signedUrl = uploadResult.secure_url.replace(/\s+/g, '');
    console.log(' Signed envelope PDF URL:', signedUrl);
    return signedUrl;

  } catch (error) {
    console.error(' Error generating envelope signed PDF:', error);
    throw error;
  }
}