// app/api/portal/[shareLink]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const shareLink = params.shareLink;

    console.log('🔍 Portal access:', shareLink);

    const db = await dbPromise;

    // Find space by share link
    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink,
      'publicAccess.enabled': true
    });

    if (!space) {
      console.log('❌ Space not found for link:', shareLink);
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired link'
      }, { status: 404 });
    }

    // Check if expired
    if (space.publicAccess.expiresAt && new Date(space.publicAccess.expiresAt) < new Date()) {
      console.log('❌ Link expired:', shareLink);
      return NextResponse.json({
        success: false,
        error: 'This link has expired'
      }, { status: 403 });
    }

    // Check view limit
    if (space.publicAccess.viewLimit && space.publicAccess.currentViews >= space.publicAccess.viewLimit) {
      console.log('❌ View limit reached:', shareLink);
      return NextResponse.json({
        success: false,
        error: 'This link has reached its view limit'
      }, { status: 403 });
    }

    // Get documents for this space
    const documents = await db.collection('documents')
      .find({ 
        spaceId: space._id.toString(),
        belongsToSpace: true
      })
      .toArray();

    // Transform documents
    const transformedDocs = documents.map(doc => ({
      id: doc._id.toString(),
      name: doc.originalFilename,
      type: doc.originalFormat || doc.mimeType,
      size: `${(doc.size / 1024).toFixed(2)} KB`,
      cloudinaryPdfUrl: doc.cloudinaryPdfUrl,
      folderId: doc.folder || null
    }));

    // Get folders (from template or custom)
    const folders = space.template ? getTemplateFolders(space.template) : [];

    console.log(`✅ Portal loaded: ${transformedDocs.length} documents`);

    return NextResponse.json({
      success: true,
      space: {
        name: space.name,
        description: space.description || '',
        branding: space.branding || {
          primaryColor: '#6366f1',
          welcomeMessage: 'Welcome to our secure document portal',
          companyName: null,
          logoUrl: null,
          coverImageUrl: null
        },
        documents: transformedDocs,
        folders
      },
      requiresEmail: space.publicAccess.requireEmail,
      requiresPassword: space.publicAccess.requirePassword
    });

  } catch (error) {
    console.error('❌ Portal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load portal'
    }, { status: 500 });
  }
}

// Helper function to get template folders
function getTemplateFolders(templateId: string) {
  const templates: { [key: string]: string[] } = {
    'client-portal': ['Company Information', 'Proposals', 'Contracts', 'Invoices', 'Reports'],
    'ma-deal': ['Financial Statements', 'Legal Documents', 'Customer Contracts', 'Employee Information'],
    'fundraising': ['Pitch Deck', 'Financial Projections', 'Cap Table', 'Product Demo'],
    'simple-data-room': ['Documents', 'Financials', 'Legal', 'Presentations'],
  };

  const folderNames = templates[templateId] || ['Documents'];
  
  return folderNames.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name
  }));
}