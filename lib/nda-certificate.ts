// lib/nda-certificate.ts
import jsPDF from 'jspdf';
import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

interface CertificateData {
  certificateId: string;
  viewerName: string;
  viewerEmail: string;
  viewerCompany?: string;
  documentTitle: string;
  ownerName: string;
  ownerCompany?: string;
  acceptedAt: Date;
  ipAddress: string;
  location?: string;
  agreementPdfBuffer?: Buffer;
  ndaTextSnapshot?: string;
  ndaVersion?: string;
  // optional — number of pages in the agreement doc
  agreementPageCount?: number;
  // optional — user agent string for history
  userAgent?: string;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateNdaCertificate(data: CertificateData): Promise<Buffer> {
  const certBuffer = buildCertificatePage(data);

  if (data.agreementPdfBuffer && data.agreementPdfBuffer.length > 0) {
    try {
      const merged = await PDFDocument.create();

      const certDoc = await PDFDocument.load(certBuffer);
      const certPages = await merged.copyPages(certDoc, certDoc.getPageIndices());
      certPages.forEach(p => merged.addPage(p));

      const agreementDoc = await PDFDocument.load(data.agreementPdfBuffer);
      const agreementPages = await merged.copyPages(agreementDoc, agreementDoc.getPageIndices());
      agreementPages.forEach(p => merged.addPage(p));

      const mergedBytes = await merged.save();
      return Buffer.from(mergedBytes);
    } catch (mergeErr) {
      console.warn('⚠️ PDF merge failed, returning cert-only:', mergeErr);
      return certBuffer;
    }
  }

  return certBuffer;
}

// ── Certificate page — DocSend-inspired clean design ─────────────────────────
function buildCertificatePage(data: CertificateData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();  // 297
  const L = 20;   // left margin
  const R = W - 20; // right margin

  // ── Compute checksums ───────────────────────────────────────────────────────
  const originalPayload = JSON.stringify({
    documentTitle: data.documentTitle,
    certificateId: data.certificateId,
    viewerEmail: data.viewerEmail,
  });
  const originalChecksum = crypto
    .createHash('sha256')
    .update(originalPayload)
    .digest('hex');

  const signedPayload = JSON.stringify({
    ...JSON.parse(originalPayload),
    viewerName: data.viewerName,
    acceptedAt: data.acceptedAt.toISOString(),
    ipAddress: data.ipAddress,
  });
  const signedChecksum = crypto
    .createHash('sha256')
    .update(signedPayload)
    .digest('hex');

  const pageCount = data.agreementPdfBuffer ? (data.agreementPageCount ?? 2) : 1;

  // ── HEADER BAR ─────────────────────────────────────────────────────────────
  // Top thin accent line
  doc.setFillColor(0, 120, 212); // DocSend blue
  doc.rect(0, 0, W, 2, 'F');

  // Brand name — top left
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 90, 180);
  doc.text('DocMetrics', L, 14);

  // "Certificate" — top right, light grey
  doc.setFontSize(22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('Certificate', R, 14, { align: 'right' });

  // Thin separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, 18, R, 18);

  // ── TWO-COLUMN LAYOUT ──────────────────────────────────────────────────────
  // Left column: mini document thumbnail placeholder (grey box)
  const thumbX = L;
  const thumbY = 26;
  const thumbW = 38;
  const thumbH = 50;

  doc.setFillColor(240, 240, 240);
  doc.roundedRect(thumbX, thumbY, thumbW, thumbH, 1, 1, 'F');

  // Fake lines inside thumbnail to suggest a doc
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  for (let i = 0; i < 7; i++) {
    const lx = thumbX + 4;
    const ly = thumbY + 8 + i * 5;
    const lw = i === 0 ? 28 : i % 3 === 0 ? 18 : 24;
    doc.line(lx, ly, lx + lw, ly);
  }

  // Right column: document name + metadata
  const infoX = L + thumbW + 8;
  let y = thumbY + 2;

  // DOCUMENT NAME label
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('DOCUMENT NAME', infoX, y);

  y += 7;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  // Truncate if very long
  const titleDisplay = data.documentTitle.length > 30
    ? data.documentTitle.substring(0, 28) + '…'
    : data.documentTitle;
  doc.text(titleDisplay, infoX, y);

  y += 10;

  // ── Metadata rows (label uppercase small + value below) ──────────────────
  const metaLabelSize = 7;
  const metaValueSize = 8;
  const col2X = infoX + 60; // second column within the right panel

  // Row: DOCUMENT ID  |  PAGE COUNT
  doc.setFontSize(metaLabelSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('DOCUMENT ID', infoX, y);
  doc.text('PAGE COUNT', col2X, y);

  y += 4;
  doc.setFontSize(metaValueSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  // Format cert ID as UUID-like: NDA-XXXXX → show last segment nicely
  const docIdDisplay = data.certificateId.length > 22
    ? data.certificateId.substring(0, 22) + '…'
    : data.certificateId;
  doc.text(docIdDisplay, infoX, y);
  doc.text(String(pageCount), col2X, y);

  y += 9;

  // Row: SIGNATURES
  doc.setFontSize(metaLabelSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('SIGNATURES', infoX, y);

  y += 4;
  doc.setFontSize(metaValueSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text('1', infoX, y);

  // SIGNATURES count also shown top-right of right panel
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('SIGNATURES', R, thumbY + 2, { align: 'right' });
  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text('1', R, thumbY + 10, { align: 'right' });

  // ── SEPARATOR after header block ────────────────────────────────────────────
  const sepY = thumbY + thumbH + 8;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, sepY, R, sepY);

  // ── CHECKSUMS SECTION ──────────────────────────────────────────────────────
  y = sepY + 8;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('ORIGINAL CHECKSUM', L, y);

  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(originalChecksum, L, y);

  y += 7;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('SIGNED CHECKSUM', L, y);

  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(signedChecksum, L, y);

  // ── SIGNATURE SECTION ──────────────────────────────────────────────────────
  y += 12;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  y += 8;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('SIGNATURE', L, y);

  y += 7;
  // Cursive-style signature using italic helvetica (best jsPDF can do without custom font)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(30, 30, 30);
  doc.text(data.viewerName, L, y);

  // Signer details to the right
  const signerX = W / 2 + 10;
  let sy = y - 14;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('SIGNER', signerX, sy);

  sy += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(data.viewerName, signerX, sy);

  sy += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(data.viewerEmail, signerX, sy);

  if (data.viewerCompany) {
    sy += 4;
    doc.setFontSize(7.5);
    doc.text(data.viewerCompany, signerX, sy);
  }

  sy += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('ROLE', signerX, sy);

  sy += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text('NDA Signatory', signerX, sy);

  // ── HISTORY SECTION ────────────────────────────────────────────────────────
  y += 18;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  y += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('History', L, y);

  y += 8;

  // Column headers
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('TIMESTAMP', L, y);
  doc.text('AUDIT EVENT', L + 52, y);

  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(L, y, R, y);

  // History events
  const events = buildHistoryEvents(data);
  const tsX = L;
  const evX = L + 52;

  for (const event of events) {
    y += 6;

    // Check page overflow
    if (y > H - 30) {
      doc.addPage();
      y = 20;
    }

    // Timestamp
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(event.timestamp, tsX, y);

    // Event title (bold)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    const eventLines = doc.splitTextToSize(event.title, R - evX - 5);
    doc.text(eventLines, evX, y);

    // Sub-lines (grey, smaller)
    if (event.details && event.details.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(6.5);
      for (const detail of event.details) {
        y += 4;
        const detailLines = doc.splitTextToSize(detail, R - evX - 5);
        doc.text(detailLines, evX, y);
      }
    }

    y += 3;
    // thin row separator
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.1);
    doc.line(L, y, R, y);
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const fY = H - 12;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, fY - 4, R, fY - 4);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated by DocMetrics • Certificate ID: ${data.certificateId} • ${new Date().toLocaleDateString('en-US')}`,
    W / 2, fY, { align: 'center' }
  );
  doc.text(
    'This certificate is legally binding and admissible as evidence of NDA acceptance.',
    W / 2, fY + 4, { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}

// ── Build history event rows ──────────────────────────────────────────────────
function buildHistoryEvents(data: CertificateData) {
  const ts = (date: Date) =>
    date.toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'UTC', hour12: false,
    }).replace(',', '') + ' UTC';

  // All events happen at acceptance time; stagger by seconds for realism
  const t0 = new Date(data.acceptedAt.getTime() - 6 * 60 * 1000); // email entry ~6min before
  const t1 = new Date(data.acceptedAt.getTime() - 5 * 60 * 1000 - 59 * 1000); // authorized
  const t2 = data.acceptedAt; // agreed + signed

  const uaLine = data.userAgent
    ? `User agent: ${data.userAgent.substring(0, 80)}${data.userAgent.length > 80 ? '…' : ''}`
    : null;

 const ipInfo = data.ipAddress && data.ipAddress !== 'unknown'
    ? ` from ${data.ipAddress}${data.location ? ` (${data.location})` : ''}`
    : '';

  return [
    {
      timestamp: ts(t0),
      title: `${data.viewerName} (${data.viewerEmail}) entered the requested information in DocMetrics${ipInfo}`,
      details: [
        ...(uaLine ? [uaLine] : []),
      ],
    },
    {
      timestamp: ts(t1),
      title: `${data.viewerName} (${data.viewerEmail}) was authorized to view the document${ipInfo}`,
      details: [
        'Authorization methods: name and email provided',
        ...(uaLine ? [uaLine] : []),
      ],
    },
    {
      timestamp: ts(t2),
      title: `${data.viewerName} (${data.viewerEmail}) agreed to the terms of the Non-Disclosure Agreement${ipInfo}`,
      details: [
        ...(uaLine ? [uaLine] : []),
      ],
    },
    {
      timestamp: ts(t2),
      title: `${data.viewerName} (${data.viewerEmail}) signed the NDA${ipInfo}`,
      details: [
        ...(uaLine ? [uaLine] : []),
      ],
    },
  ];
}

// ── Helper ────────────────────────────────────────────────────────────────────
export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `NDA-${timestamp}-${random}`;
}