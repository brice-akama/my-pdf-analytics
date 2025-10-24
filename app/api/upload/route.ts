// app/api/upload/route.ts
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

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
    
    console.log('📄 Processing PDF:', file.name, 'Size:', buffer.length);

    // Basic PDF page count estimation (not 100% accurate but works)
    const pageCount = await estimatePdfPages(buffer);

    const db = await dbPromise;
    
    const doc = {
      userId: user.id,
      plan: user.plan,
      filename: file.name,
      mimeType: file.type,
      size: buffer.length,
      numPages: pageCount,
      textPreview: '',
      createdAt: new Date(),
    };

    const result = await db.collection('documents').insertOne(doc);
    
    console.log('✅ Document saved to DB:', result.insertedId);

    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      numPages: pageCount,
      filename: file.name,
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ PDF upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF. Please try again.' 
    }, { status: 500 });
  }
}

// Simple PDF page count estimation
async function estimatePdfPages(buffer: Buffer): Promise<number> {
  try {
    const pdfString = buffer.toString('binary');
    // Count /Type /Page occurrences (basic method)
    const matches = pdfString.match(/\/Type[\s]*\/Page[^s]/g);
    return matches ? matches.length : 1;
  } catch {
    return 1; // Default to 1 page if counting fails
  }
}