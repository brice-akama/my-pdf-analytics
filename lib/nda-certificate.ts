// lib/nda-certificate.ts
import jsPDF from 'jspdf';
import crypto from 'crypto';

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
  ndaTextSnapshot: string;
  ndaVersion?: string;
}

export function generateNdaCertificate(data: CertificateData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let y = 20; // Starting Y position

  // ===== HEADER SECTION =====
  
  // Decorative header border
  doc.setDrawColor(139, 92, 246); // Purple
  doc.setLineWidth(0.5);
  doc.line(15, 15, pageWidth - 15, 15);
  doc.line(15, 17, pageWidth - 15, 17);
  
  // Logo placeholder / Icon
  doc.setFillColor(139, 92, 246);
  doc.circle(pageWidth / 2, 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('✓', pageWidth / 2, 32, { align: 'center' });

  // Title
  y = 45;
  doc.setTextColor(30, 41, 59); // slate-900
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF NDA ACCEPTANCE', pageWidth / 2, y, { align: 'center' });

  // Subtitle
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Official Record of Non-Disclosure Agreement Acceptance', pageWidth / 2, y, { align: 'center' });

  // Decorative line
  y += 8;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(40, y, pageWidth - 40, y);

  // ===== DOCUMENT INFORMATION SECTION =====
  
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Document Information', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoBox1Y = y;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(20, infoBox1Y, pageWidth - 40, 35, 3, 3, 'F');
  
  y += 6;
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Document Title:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.documentTitle, 70, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Shared By:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.ownerName, 70, y);

  if (data.ownerCompany) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Organization:', 25, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(data.ownerCompany, 70, y);
  }

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('NDA Version:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.ndaVersion || 'Standard', 70, y);

  // ===== ACCEPTANCE DETAILS SECTION =====
  
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Acceptance Details', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoBox2Y = y;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(20, infoBox2Y, pageWidth - 40, 42, 3, 3, 'F');
  
  y += 6;
  doc.setTextColor(71, 85, 105);
  doc.text('Accepted By:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.viewerName, 70, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Email Address:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.viewerEmail, 70, y);

  if (data.viewerCompany) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Company:', 25, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(data.viewerCompany, 70, y);
  }

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Date & Time:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  const formattedDate = data.acceptedAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  doc.text(formattedDate, 70, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('IP Address:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.ipAddress, 70, y);

  // ===== VERIFICATION SECTION =====
  
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Verification', 20, y);

  y += 8;
  const verificationBoxY = y;
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(20, verificationBoxY, pageWidth - 40, 28, 3, 3, 'F');
  
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Certificate ID:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.certificateId, 70, y);

  // Generate digital signature (hash)
  const signatureData = JSON.stringify({
    certificateId: data.certificateId,
    viewerEmail: data.viewerEmail,
    documentTitle: data.documentTitle,
    acceptedAt: data.acceptedAt.toISOString(),
  });
  const digitalSignature = crypto
    .createHash('sha256')
    .update(signatureData)
    .digest('hex')
    .substring(0, 32)
    .toUpperCase();

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Digital Signature:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(digitalSignature, 70, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Issued:', 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(new Date().toLocaleDateString('en-US'), 70, y);

  // ===== NDA TEXT SNAPSHOT =====
  
  y += 15;
  if (y + 40 > pageHeight - 30) {
    // Add new page if not enough space
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('NDA Terms Accepted', 20, y);

  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  const ndaLines = doc.splitTextToSize(data.ndaTextSnapshot, pageWidth - 50);
  const maxNdaLines = 25; // Limit to prevent overflow
  const displayLines = ndaLines.slice(0, maxNdaLines);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, (displayLines.length * 4) + 10, 3, 3, 'F');
  
  y += 6;
  displayLines.forEach((line: string) => {
    doc.text(line, 25, y);
    y += 4;
  });

  if (ndaLines.length > maxNdaLines) {
    doc.setTextColor(100, 116, 139);
    doc.text('... (Full NDA text stored in database)', 25, y);
  }

  // ===== FOOTER =====
  
  const footerY = pageHeight - 20;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This certificate serves as official proof of NDA acceptance. It is legally binding and admissible as evidence.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  
  doc.text(
    `Generated by DocMetrics on ${new Date().toLocaleDateString('en-US')} • Certificate ID: ${data.certificateId}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

// Helper function to generate certificate ID
export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `NDA-${timestamp}-${random}`;
}