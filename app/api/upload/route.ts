// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

// Use dynamic import with @ts-ignore (safe for server-side)
async function parsePdf(buffer: Buffer) {
  // @ts-ignore: pdf-parse has no TS default export, but works at runtime
  const pdfParse = (await import('pdf-parse')).default;
  return await pdfParse(buffer);
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const pdfData = await parsePdf(buffer);
    console.log('📄 Parsed PDF:', {
      nPages: pdfData.numpages,
      textPreview: pdfData.text.substring(0, 100) + '...',
    });

    const db = await dbPromise;
    const doc = {
      userId: user.id,
      plan: user.plan,
      filename: file.name,
      mimeType: file.type,
      size: buffer.length,
      numPages: pdfData.numpages,
      textPreview: pdfData.text.substring(0, 500),
      createdAt: new Date(),
    };

    const result = await db.collection('documents').insertOne(doc);
    
    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      numPages: pdfData.numpages,
    }, { status: 201 });

  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
}