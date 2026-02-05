// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Get user's organization
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });

    const organizationId = profile?.organization_id || user.id;
    const userOrgRole = profile?.role || 'owner';
    const isOrgOwner = organizationId === user.id;

    console.log('🔍 Search - User:', user.email);
    console.log('🔍 Search - Organization:', organizationId);
    console.log('🔍 Search - Role:', userOrgRole);

    // Get search query
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: {},
        totalResults: 0,
        message: 'Query too short'
      });
    }

    console.log('🔍 Searching for:', query);

    // Create search regex (case-insensitive)
    const searchRegex = new RegExp(query, 'i');

    // ==========================================
    // PARALLEL SEARCH ACROSS ALL COLLECTIONS
    // ==========================================

    const [
      documents,
      spaces,
      spaceFolders,
      signatureRequests,
      fileRequests,
      contacts,
      teamMembers,
      shares,
      templates,
      ndaTemplates
    ] = await Promise.all([
      
      // 1. DOCUMENTS
      db.collection('documents').find({
        organizationId,
        archived: { $ne: true },
        $or: [
          { originalFilename: searchRegex },
          { filename: searchRegex },
          { tags: searchRegex },
          { notes: searchRegex }
        ],
        ...(isOrgOwner ? {} : { userId: user.id }) // Team members see only their docs
      })
      .limit(limit)
      .project({
        _id: 1,
        originalFilename: 1,
        size: 1,
        createdAt: 1,
        cloudinaryPdfUrl: 1,
        numPages: 1,
        folder: 1,
        spaceId: 1,
        belongsToSpace: 1
      })
      .toArray(),

      // 2. SPACES (Data Rooms)
      db.collection('spaces').find({
        organizationId,
        archived: { $ne: true },
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        members: 1
      })
      .toArray(),

      // 3. SPACE FOLDERS
      db.collection('space_folders').find({
        organizationId,
        archived: { $ne: true },
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        name: 1,
        spaceId: 1,
        parentId: 1,
        createdAt: 1
      })
      .toArray(),

      // 4. SIGNATURE REQUESTS (Agreements)
      db.collection('signature_requests').find({
        organizationId,
        archived: { $ne: true },
        $or: [
          { title: searchRegex },
          { documentName: searchRegex },
          { 'signers.email': searchRegex }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        title: 1,
        documentName: 1,
        status: 1,
        createdAt: 1,
        documentId: 1,
        signers: 1
      })
      .toArray(),

      // 5. FILE REQUESTS
      db.collection('file_requests').find({
        organizationId,
        archived: { $ne: true },
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { 'recipients.email': searchRegex }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        dueDate: 1,
        filesReceived: 1,
        totalFiles: 1,
        createdAt: 1
      })
      .toArray(),

      // 6. CONTACTS
      db.collection('contacts').find({
        organizationId,
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { company: searchRegex },
          { phone: searchRegex }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        name: 1,
        email: 1,
        company: 1,
        phone: 1,
        createdAt: 1
      })
      .toArray(),

      // 7. TEAM MEMBERS
      db.collection('organization_members').find({
        organizationId,
        status: 'active',
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        avatarUrl: 1,
        joinedAt: 1
      })
      .toArray(),

      // 8. SHARES (Shared Links)
      db.collection('shares').find({
        organizationId,
        active: true,
        $or: [
          { documentName: searchRegex },
          { recipientEmail: searchRegex },
          { shareToken: searchRegex }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        documentId: 1,
        documentName: 1,
        recipientEmail: 1,
        expiresAt: 1,
        createdAt: 1
      })
      .toArray(),

      // 9. TEMPLATES
      db.collection('templates').find({
        $and: [
          {
            $or: [
              { organizationId }, // Org templates
              { isPublic: true }   // Public templates
            ]
          },
          { archived: { $ne: true } },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { category: searchRegex }
            ]
          }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        name: 1,
        description: 1,
        category: 1,
        popular: 1,
        createdAt: 1
      })
      .toArray(),

      // 10. NDA TEMPLATES
      db.collection('nda_templates').find({
        $and: [
          {
            $or: [
              { organizationId },
              { isPublic: true }
            ]
          },
          { archived: { $ne: true } },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { category: searchRegex }
            ]
          }
        ]
      })
      .limit(limit)
      .project({
        _id: 1,
        name: 1,
        description: 1,
        category: 1,
        createdAt: 1
      })
      .toArray()
    ]);

    // ==========================================
    // TRANSFORM RESULTS FOR FRONTEND
    // ==========================================

    const transformedResults = {
      documents: documents.map(doc => ({
        id: doc._id.toString(),
        type: 'document',
        title: doc.originalFilename,
        subtitle: `${(doc.size / 1024).toFixed(2)} KB • ${doc.numPages || 0} pages`,
        url: `/documents/${doc._id.toString()}`,
        icon: 'FileText',
        badge: 'Document',
        createdAt: doc.createdAt
      })),

      spaces: spaces.map(space => ({
        id: space._id.toString(),
        type: 'space',
        title: space.name,
        subtitle: space.description || `${space.members?.length || 0} members`,
        url: `/spaces/${space._id.toString()}`,
        icon: 'FolderOpen',
        badge: 'Data Room',
        createdAt: space.createdAt
      })),

      folders: spaceFolders.map(folder => ({
        id: folder._id.toString(),
        type: 'folder',
        title: folder.name,
        subtitle: folder.spaceId ? 'Space folder' : 'Root folder',
        url: folder.spaceId 
          ? `/spaces/${folder.spaceId}?folder=${folder._id.toString()}`
          : `/folders/${folder._id.toString()}`,
        icon: 'Folder',
        badge: 'Folder',
        createdAt: folder.createdAt
      })),

      agreements: signatureRequests.map(req => ({
        id: req._id.toString(),
        type: 'agreement',
        title: req.title || req.documentName,
        subtitle: `${req.status} • ${req.signers?.length || 0} signers`,
        url: req.documentId 
          ? `/documents/${req.documentId}/signature`
          : `/agreements/${req._id.toString()}`,
        icon: 'FileSignature',
        badge: 'Agreement',
        createdAt: req.createdAt
      })),

      fileRequests: fileRequests.map(req => ({
        id: req._id.toString(),
        type: 'fileRequest',
        title: req.title,
        subtitle: req.description || `${req.filesReceived}/${req.totalFiles} files received`,
        url: `/file-requests/${req._id.toString()}`,
        icon: 'Inbox',
        badge: 'File Request',
        createdAt: req.createdAt
      })),

      contacts: contacts.map(contact => ({
        id: contact._id.toString(),
        type: 'contact',
        title: contact.name,
        subtitle: `${contact.email}${contact.company ? ' • ' + contact.company : ''}`,
        url: `/dashboard?page=contacts&id=${contact._id.toString()}`,
        icon: 'User',
        badge: 'Contact',
        createdAt: contact.createdAt
      })),

      team: teamMembers.map(member => ({
        id: member._id.toString(),
        type: 'teamMember',
        title: member.name,
        subtitle: `${member.email} • ${member.role}`,
        url: `/dashboard?page=team&id=${member._id.toString()}`,
        icon: 'Users',
        badge: 'Team Member',
        createdAt: member.joinedAt
      })),

      shares: shares.map(share => ({
        id: share._id.toString(),
        type: 'share',
        title: share.documentName || 'Shared Document',
        subtitle: `Shared with ${share.recipientEmail}`,
        url: `/documents/${share.documentId}`,
        icon: 'Share2',
        badge: 'Shared',
        createdAt: share.createdAt
      })),

      templates: templates.map(template => ({
        id: template._id.toString(),
        type: 'template',
        title: template.name,
        subtitle: template.description || template.category,
        url: `/templates/${template._id.toString()}`,
        icon: 'FileCheck',
        badge: 'Template',
        createdAt: template.createdAt
      })),

      ndaTemplates: ndaTemplates.map(nda => ({
        id: nda._id.toString(),
        type: 'ndaTemplate',
        title: nda.name,
        subtitle: nda.description || nda.category,
        url: `/agreements/templates/${nda._id.toString()}`,
        icon: 'FileSignature',
        badge: 'NDA Template',
        createdAt: nda.createdAt
      }))
    };

    // Calculate totals
    const totalResults = 
      documents.length +
      spaces.length +
      spaceFolders.length +
      signatureRequests.length +
      fileRequests.length +
      contacts.length +
      teamMembers.length +
      shares.length +
      templates.length +
      ndaTemplates.length;

    console.log(`✅ Found ${totalResults} total results`);

    return NextResponse.json({
      success: true,
      query,
      results: transformedResults,
      totalResults,
      resultCounts: {
        documents: documents.length,
        spaces: spaces.length,
        folders: spaceFolders.length,
        agreements: signatureRequests.length,
        fileRequests: fileRequests.length,
        contacts: contacts.length,
        team: teamMembers.length,
        shares: shares.length,
        templates: templates.length,
        ndaTemplates: ndaTemplates.length
      }
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}