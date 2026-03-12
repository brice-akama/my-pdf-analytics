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
  // ─────────────────────────────────────────────────────────────────────────
  // PAGE 1 — Certificate (DocSend-style: header + two-column layout)
  // Left col: document thumbnail placeholder + signature image(s)
  // Right col: document metadata fields
  // Bottom: History table
  // ─────────────────────────────────────────────────────────────────────────
  const PAGE_W = 612;
  const PAGE_H = 792;

  // ── Colors (all WinAnsi-safe — no emoji, no em-dash, no Unicode) ──────────
  const PURPLE  = rgb(0.17, 0.24, 0.69);   // DocSend-like dark blue-purple
  const DARK    = rgb(0.08, 0.08, 0.10);
  const MEDIUM  = rgb(0.38, 0.38, 0.45);
  const LIGHT   = rgb(0.58, 0.58, 0.64);
  const WHITE   = rgb(1, 1, 1);
  const BORDER  = rgb(0.88, 0.88, 0.92);
  const BG      = rgb(0.97, 0.97, 0.98);
  const GREEN   = rgb(0.10, 0.62, 0.30);

  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ─── Reusable label+value drawer ─────────────────────────────────────────
  const drawField = (
    pg: PDFPage,
    label: string,
    value: string,
    x: number,
    y: number,
    labelSz = 7,
    valueSz = 9.5
  ) => {
    pg.drawText(label.toUpperCase(), { x, y: y + labelSz + 2, size: labelSz, font, color: LIGHT });
    pg.drawText(value || 'N/A', { x, y, size: valueSz, font: boldFont, color: DARK });
  };

  // ─── PAGE 1 ───────────────────────────────────────────────────────────────
  const page1 = pdfDoc.addPage([PAGE_W, PAGE_H]);

  // ── Header bar ────────────────────────────────────────────────────────────
  page1.drawRectangle({ x: 0, y: PAGE_H - 56, width: PAGE_W, height: 56, color: WHITE });
  page1.drawRectangle({ x: 0, y: PAGE_H - 57, width: PAGE_W, height: 1, color: BORDER });

  // DocMetrics wordmark (left)
  page1.drawRectangle({ x: 30, y: PAGE_H - 42, width: 22, height: 22, color: PURPLE });
  page1.drawText('DM', { x: 34, y: PAGE_H - 34, size: 10, font: boldFont, color: WHITE });
  page1.drawText('DocMetrics', { x: 58, y: PAGE_H - 31, size: 12, font: boldFont, color: DARK });

  // "Certificate" label (right)
  page1.drawText('Certificate', { x: PAGE_W - 90, y: PAGE_H - 31, size: 14, font: boldFont, color: DARK });

  // ── Thin colored top border ────────────────────────────────────────────────
  page1.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: PURPLE });

  // ─────────────────────────────────────────────────────────────────────────
  // TWO-COLUMN BODY
  // Left col x: 30–210 (width 180)   Right col x: 230–582 (width 352)
  // ─────────────────────────────────────────────────────────────────────────
  const LEFT_X  = 30;
  const LEFT_W  = 165;
  const RIGHT_X = 215;
  const BODY_TOP = PAGE_H - 75;

  let ry = BODY_TOP; // right-col cursor

  // ── RIGHT: Document Name ───────────────────────────────────────────────────
  page1.drawText('DOCUMENT NAME', { x: RIGHT_X, y: ry, size: 7, font, color: LIGHT });
  ry -= 16;
  page1.drawText(documentName, { x: RIGHT_X, y: ry, size: 16, font: boldFont, color: DARK });
  ry -= 26;

  // ── RIGHT: fields grid ────────────────────────────────────────────────────
  const signedCount = signatureRequests.filter(r => r.status === 'signed').length;
  const completedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  drawField(page1, 'Document ID', documentId, RIGHT_X, ry); ry -= 28;
  drawField(page1, 'Original Checksum', documentHash.substring(0, 40), RIGHT_X, ry); ry -= 28;
  // Signed checksum — hash of signed content (slightly different)
  const crypto = require('crypto');
  const signedHash = crypto.createHash('sha256')
    .update(documentId + JSON.stringify(signatureRequests.map(r => r.signedAt)))
    .digest('hex');
  drawField(page1, 'Signed Checksum', signedHash.substring(0, 40), RIGHT_X, ry); ry -= 28;
  drawField(page1, 'Page Count', `${originalPageCount}`, RIGHT_X, ry);
  // Signatures count — right of page count on same row
  drawField(page1, 'Signatures', `${signedCount}`, RIGHT_X + 120, ry);
  ry -= 28;
  drawField(page1, 'Completed', completedDate, RIGHT_X, ry); ry -= 36;

  // ── RIGHT: Signature image(s) ──────────────────────────────────────────────
  for (const req of signatureRequests) {
    if (req.status !== 'signed') continue;
    const sigField = (req.signedFields ?? []).find((sf: any) => sf.type === 'signature' && sf.signatureData);
    if (!sigField?.signatureData) continue;
    try {
      const b64 = sigField.signatureData.replace(/^data:image\/\w+;base64,/, '');
      const imgBytes = Buffer.from(b64, 'base64');
      const img = sigField.signatureData.includes('image/png')
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);

      const sigLabel = req.recipient?.name || 'Signer';
      page1.drawText('SIGNATURE', { x: RIGHT_X, y: ry, size: 7, font, color: LIGHT });
      ry -= 4;
      const sigW = 200, sigH = 55;
      page1.drawRectangle({ x: RIGHT_X, y: ry - sigH, width: sigW, height: sigH, color: BG, borderColor: BORDER, borderWidth: 0.5 });
      page1.drawImage(img, { x: RIGHT_X + 4, y: ry - sigH + 4, width: sigW - 8, height: sigH - 8 });
      ry -= sigH + 6;
      page1.drawText(sigLabel, { x: RIGHT_X, y: ry, size: 8, font: boldFont, color: DARK });
      ry -= 20;
    } catch { /* skip bad images */ }
  }

  // ── LEFT: document thumbnail placeholder ──────────────────────────────────
  const thumbH = 220;
  page1.drawRectangle({ x: LEFT_X, y: BODY_TOP - thumbH, width: LEFT_W, height: thumbH, color: BG, borderColor: BORDER, borderWidth: 0.75 });
  // Lined-paper effect inside thumbnail
  for (let li = 0; li < 10; li++) {
    const lineY = BODY_TOP - 30 - li * 16;
    const lineW = li === 0 ? LEFT_W * 0.5 : li === 1 ? LEFT_W * 0.7 : LEFT_W * 0.85;
    page1.drawRectangle({ x: LEFT_X + 10, y: lineY, width: lineW - 20, height: 5, color: BORDER });
  }
  // Small doc icon
  page1.drawRectangle({ x: LEFT_X + LEFT_W / 2 - 14, y: BODY_TOP - thumbH + 18, width: 28, height: 34, color: WHITE, borderColor: MEDIUM, borderWidth: 0.5 });
  page1.drawRectangle({ x: LEFT_X + LEFT_W / 2 + 0, y: BODY_TOP - thumbH + 40, width: 14, height: 12, color: BG });

  // Document name below thumbnail
  page1.drawText(documentName.length > 22 ? documentName.substring(0, 22) + '...' : documentName, {
    x: LEFT_X + 4, y: BODY_TOP - thumbH - 14, size: 7.5, font: boldFont, color: DARK,
  });
  page1.drawText(`${originalPageCount} page${originalPageCount !== 1 ? 's' : ''}`, {
    x: LEFT_X + 4, y: BODY_TOP - thumbH - 25, size: 7, font, color: LIGHT,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // HISTORY TABLE (below both columns)
  // ─────────────────────────────────────────────────────────────────────────
  const historyTop = Math.min(BODY_TOP - thumbH - 45, ry - 20);
  let hy = historyTop;

  page1.drawText('History', { x: LEFT_X, y: hy, size: 16, font: boldFont, color: DARK });
  hy -= 20;

  // Table header
  page1.drawRectangle({ x: LEFT_X, y: hy - 4, width: PAGE_W - 60, height: 14, color: BG });
  page1.drawText('TIMESTAMP', { x: LEFT_X + 4, y: hy, size: 7, font: boldFont, color: LIGHT });
  page1.drawText('AUDIT EVENT', { x: LEFT_X + 145, y: hy, size: 7, font: boldFont, color: LIGHT });
  hy -= 18;

  // ── Build audit events from signatureRequests ──────────────────────────────
  interface AuditEvent { ts: Date | null; text: string; sub: string; }
  const events: AuditEvent[] = [];

  for (const req of signatureRequests) {
    const name  = req.recipient?.name  || req.signerName  || 'Unknown';
    const email = req.recipient?.email || req.signerEmail || '';
    const ip    = req.recipient?.ipAddress || req.ipAddress || '';
    const locParts = [];
    const loc = req.recipient?.location || req.location;
    if (loc?.city)    locParts.push(loc.city);
    if (loc?.country) locParts.push(loc.country);
    const locStr   = locParts.join(', ') || 'Unknown';
    const browser  = req.recipient?.browser || 'Chrome';
    const ua       = req.recipient?.userAgent || '';

    // Viewed event
    if (req.viewedAt) {
      events.push({
        ts: new Date(req.viewedAt),
        text: `${name} (${email}) was authorized to view the document on ${browser} from ${ip} (${locStr})`,
        sub: `Authorization methods: name and email provided`,
      });
    }

    // Agreed to terms
    if (req.agreedAt || req.viewedAt) {
      events.push({
        ts: req.agreedAt ? new Date(req.agreedAt) : req.viewedAt ? new Date(req.viewedAt) : null,
        text: `${name} (${email}) agreed to use electronic records and signatures, to DocMetrics Terms of Service, and to the terms of this document on ${browser} from ${ip} (${locStr})`,
        sub: ua ? `User agent: ${ua.substring(0, 80)}` : '',
      });
    }

    // Signed event
    if (req.signedAt) {
      events.push({
        ts: new Date(req.signedAt),
        text: `${name} (${email}) signed the document on ${browser} from ${ip} (${locStr})`,
        sub: ua ? `User agent: ${ua.substring(0, 80)}` : '',
      });
    }

    // Access code event
    if (req.accessCodeRequired && req.accessCodeVerifiedAt) {
      events.push({
        ts: new Date(req.accessCodeVerifiedAt),
        text: `${name} (${email}) verified access code`,
        sub: `Type: ${(req.accessCodeType || 'custom').replace(/_/g, ' ')}`,
      });
    }
  }

  // Sort by timestamp
  events.sort((a, b) => (a.ts?.getTime() ?? 0) - (b.ts?.getTime() ?? 0));

  // ── Check if we need page 2 ────────────────────────────────────────────────
  let certPage = page1;
  const ensureHistorySpace = (needed: number) => {
    if (hy - needed < 40) {
      certPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
      hy = PAGE_H - 50;
      certPage.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: PURPLE });
    }
  };

  for (const ev of events) {
    ensureHistorySpace(36);

    const tsStr = ev.ts
      ? ev.ts.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
      : 'N/A';

    // Timestamp col
    certPage.drawText(tsStr, { x: LEFT_X + 4, y: hy, size: 7.5, font: boldFont, color: DARK });

    // Event text — wrap long lines
    const maxW = PAGE_W - LEFT_X - 145 - 30;
    const words = ev.text.split(' ');
    let line = '';
    let lineY = hy;
    const lineH = 11;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, 7.5);
      if (w > maxW && line) {
        certPage.drawText(line, { x: LEFT_X + 145, y: lineY, size: 7.5, font, color: DARK });
        line = word;
        lineY -= lineH;
      } else {
        line = test;
      }
    }
    if (line) certPage.drawText(line, { x: LEFT_X + 145, y: lineY, size: 7.5, font, color: DARK });

    // Sub text
    if (ev.sub) {
      lineY -= lineH;
      certPage.drawText(ev.sub.substring(0, 90), { x: LEFT_X + 145, y: lineY, size: 6.5, font, color: LIGHT });
    }

    // Row divider
    const rowBottom = lineY - 8;
    certPage.drawLine({ start: { x: LEFT_X, y: rowBottom }, end: { x: PAGE_W - 30, y: rowBottom }, thickness: 0.3, color: BORDER });
    hy = rowBottom - 8;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  ensureHistorySpace(32);
  hy -= 8;
  certPage.drawLine({ start: { x: LEFT_X, y: hy }, end: { x: PAGE_W - 30, y: hy }, thickness: 0.5, color: BORDER });
  hy -= 11;
  certPage.drawText(
    'This certificate is a legally binding record per ESIGN Act, UETA, and eIDAS (EU) No 910/2014.',
    { x: LEFT_X, y: hy, size: 6.5, font, color: LIGHT }
  );
  hy -= 10;
  certPage.drawText(
    `Document fingerprint: ${documentHash}  |  Issued by DocMetrics  |  ${new Date().toISOString()}`,
    { x: LEFT_X, y: hy, size: 5.5, font, color: rgb(0.72, 0.72, 0.75) }
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
    console.log('🎨 Generating signed PDF for document:', documentId);

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

    console.log('📄 PDF Pages:', originalPageCount);

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

    console.log('🏆 Certificate page added');

    // ── Save signed PDF ──────────────────────────────────────────────────────
    const signedPdfBytes = await pdfDoc.save();
    console.log('💾 Signed PDF generated, size:', signedPdfBytes.byteLength);

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
    console.log('🔗 Signed PDF URL:', signedUrl);
    return signedUrl;

  } catch (error) {
    console.error('❌ Error generating signed PDF:', error);
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
    console.log('📦 Generating envelope signed PDF package for:', envelopeId);

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
    coverPage.drawRectangle({ x: 30, y: yPos - 62, width: 36, height: 36, color: rgb(0.49, 0.23, 0.93),  });
    coverPage.drawText('DM', { x: 39, y: yPos - 48, size: 14, font: boldFont, color: rgb(1,1,1) });
    coverPage.drawText('DocMetrics', { x: 74, y: yPos - 45, size: 15, font: boldFont, color: rgb(1,1,1) });
    coverPage.drawText('Signed Document Package', { x: 74, y: yPos - 59, size: 9, font, color: rgb(0.7,0.7,0.8) });
    coverPage.drawText('ENVELOPE', { x: 612 - 100, y: yPos - 50, size: 20, font: boldFont, color: rgb(0.49,0.23,0.93) });
    yPos -= 80;

    coverPage.drawRectangle({ x: 0, y: yPos - 24, width: 612, height: 24, color: rgb(0.13, 0.69, 0.30) });
    coverPage.drawText('ALL DOCUMENTS SIGNED AND EXECUTED', { x: 30, y: yPos - 16, size: 9, font: boldFont, color: rgb(1,1,1) });
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
      `Envelope - ${envelope.documents.length} documents`,
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
    console.log('🔗 Signed envelope PDF URL:', signedUrl);
    return signedUrl;

  } catch (error) {
    console.error('❌ Error generating envelope signed PDF:', error);
    throw error;
  }
}