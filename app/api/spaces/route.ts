 

// app/api/spaces/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getTeamMemberIds } from '../lib/teamHelpers'




 export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const profile = await db.collection("profiles").findOne({ user_id: user.id });
    const userOrgId = profile?.organization_id;
    const userRole = profile?.role || "owner";

    console.log(`🔍 Fetching spaces for user: ${user.email}`);
    console.log(`   - Organization: ${userOrgId || 'NONE (personal)'}`);
    console.log(`   - Role: ${userRole}`);

    // ✅ Pagination support
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0'); // 0 = fetch all
    const skip = (page - 1) * limit;

    // ✅ Search support
    const searchQuery = searchParams.get('search') || '';
    const searchRegex = searchQuery ? new RegExp(searchQuery, 'i') : null; // Case-insensitive search

    let ownedSpaces: any[] = [];
    let memberSpaces: any[] = [];

    const isOrgOwner = !userOrgId && user.id;
    const effectiveOrgId = userOrgId || user.id;
    const hasOrganization = await db.collection('organization_members')
      .countDocuments({ organizationId: effectiveOrgId }) > 0;

    // Base query for search
    const searchCondition = searchRegex ? {
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    } : {};

    if (userOrgId || hasOrganization) {
      // ========================================
      // USER HAS A TEAM
      // ========================================
      console.log(`👥 Fetching team spaces for org: ${effectiveOrgId}`);
      console.log(`   User role: ${userRole || 'owner'}`);

      // Base query for owned spaces
      const ownedSpacesBaseQuery = {
        $or: [
          { organizationId: effectiveOrgId },
          {
            userId: user.id,
            $or: [
              { organizationId: null },
              { organizationId: { $exists: false } }
            ]
          }
        ]
      };

      // Combine with search condition if search query exists
      const ownedSpacesQuery = searchRegex ? { $and: [ownedSpacesBaseQuery, searchCondition] } : ownedSpacesBaseQuery;

      const ownedSpacesCursor = db.collection('spaces')
        .find(ownedSpacesQuery)
        .sort({ updatedAt: -1 });

      ownedSpaces = limit > 0
        ? await ownedSpacesCursor.skip(skip).limit(limit).toArray()
        : await ownedSpacesCursor.toArray();

      console.log(`✅ Found ${ownedSpaces.length} team spaces`);
    } else {
      // ========================================
      // NO TEAM - Personal Spaces Only
      // ========================================

      // Base query for personal owned spaces
      const personalOwnedSpacesBaseQuery = {
        userId: user.id,
        $or: [
          { organizationId: null },
          { organizationId: { $exists: false } }
        ]
      };

      // Combine with search condition if search query exists
      const personalOwnedSpacesQuery = searchRegex
        ? { $and: [personalOwnedSpacesBaseQuery, searchCondition] }
        : personalOwnedSpacesBaseQuery;

      const personalOwnedSpacesCursor = db.collection('spaces')
        .find(personalOwnedSpacesQuery)
        .sort({ updatedAt: -1 });

      ownedSpaces = limit > 0
        ? await personalOwnedSpacesCursor.skip(skip).limit(limit).toArray()
        : await personalOwnedSpacesCursor.toArray();

      // Base query for shared spaces
      const sharedSpacesBaseQuery = {
        'members.email': user.email,
        userId: { $ne: user.id },
        $or: [
          { organizationId: null },
          { organizationId: { $exists: false } }
        ]
      };

      // Combine with search condition if search query exists
      const sharedSpacesQuery = searchRegex
        ? { $and: [sharedSpacesBaseQuery, searchCondition] }
        : sharedSpacesBaseQuery;

      const sharedSpacesCursor = db.collection('spaces')
        .find(sharedSpacesQuery)
        .sort({ createdAt: -1 });

      memberSpaces = limit > 0
        ? await sharedSpacesCursor.skip(skip).limit(limit).toArray()
        : await sharedSpacesCursor.toArray();

      console.log(`✅ Personal: ${ownedSpaces.length} owned, ${memberSpaces.length} shared`);
    }

    // ✅ Format spaces
    const formattedOwned = ownedSpaces.map(space => ({
      _id: space._id.toString(),
      name: space.name,
      description: space.description || '',
      type: space.type || 'custom',
      status: space.status || 'active',
      template: space.template,
      color: space.color || '#8B5CF6',
      organizationId: space.organizationId || null,
      createdBy: space.createdBy || space.userId,
      owner: {
        name: user.email,
        email: user.email
      },
      documentsCount: space.documentsCount || 0,
      teamMembers: space.teamMembers || space.members?.length || 1,
      viewsCount: space.viewsCount || 0,
      lastActivity: space.lastActivity || space.updatedAt || space.createdAt,
      createdAt: space.createdAt,
      permissions: {
        canView: true,
        canEdit: true,
        canShare: true,
        canDownload: true
      },
      isOwner: space.userId === user.id || space.createdBy === user.id,
      role: space.userId === user.id ? 'owner' : 'admin'
    }));

    const formattedMember = memberSpaces.map(space => {
      const member = space.members?.find((m: any) => m.email === user.email);
      const role = member?.role || 'viewer';

      return {
        _id: space._id.toString(),
        name: space.name,
        description: space.description || '',
        type: space.type || 'custom',
        status: space.status || 'active',
        template: space.template,
        color: space.color || '#8B5CF6',
        organizationId: space.organizationId || null,
        createdBy: space.createdBy || space.userId,
        documentsCount: space.documentsCount || 0,
        teamMembers: space.teamMembers || space.members?.length || 1,
        viewsCount: space.viewsCount || 0,
        lastActivity: space.lastActivity || space.updatedAt || space.createdAt,
        createdAt: space.createdAt,
        permissions: {
          canView: true,
          canEdit: role === 'editor' || role === 'admin',
          canShare: role === 'admin',
          canDownload: space.settings?.allowDownloads !== false
        },
        isOwner: false,
        role: role
      };
    });

    const allSpaces = [...formattedOwned, ...formattedMember];

    // ✅ Pagination metadata
    const totalSpaces = allSpaces.length;
    const totalPages = limit > 0 ? Math.ceil(totalSpaces / limit) : 1;

    console.log(`✅ Returning ${allSpaces.length} total spaces`);

    return NextResponse.json({
      success: true,
      spaces: allSpaces,
      pagination: limit > 0 ? {
        page,
        limit,
        totalSpaces,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      } : null
    });

  } catch (error) {
    console.error('❌ Fetch spaces error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}


// Create new space

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      template,
      color,
      description,
      type,
      privacy,
      autoExpiry,
      expiryDate,
      requireNDA,
      enableWatermark,
      allowDownloads,
      notifyOnView,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // ✅ CRITICAL FIX: Get user's organization from profile
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const userOrgId = profile?.organization_id; // This is the TEAM organization
    
    console.log(`📍 User ${user.email} creating space`);
    console.log(`📍 User's organization_id from profile:`, userOrgId);
    console.log(`📍 User's role:`, profile?.role);

    // ✅ Get all team members if user is part of an organization
    let allOrgMembers: any[] = [];
    if (userOrgId) {
      // This user is part of a TEAM (invited via /api/team)
      allOrgMembers = await db.collection('organization_members')
        .find({
          organizationId: userOrgId,
          status: 'active'
        })
        .toArray();
      
      console.log(`👥 Found ${allOrgMembers.length} team members in org ${userOrgId}`);
    }

    // Create space
    const space = {
      userId: user.id,
      createdBy: user.id,
      
      // ✅ CRITICAL: Use team's organizationId (from profile)
      organizationId: userOrgId || null,
      
      name: name.trim(),
      description: description || '',
      type: type || 'custom',
      template: template || null,
      color: color || '#8B5CF6',
      active: true,
      status: 'active',


      //     ndaSettings with this:
  ndaSettings: {
    enabled: false,                    // Owner toggles this on/off
    ndaDocumentId: null,               // Reference to uploaded NDA PDF
    ndaDocumentName: null,             // "Company_NDA.pdf"
    ndaDocumentUrl: null,              // Cloudinary URL to NDA PDF
    signingRequired: true,             // Always true for clients
    uploadedAt: null,
    uploadedBy: null
  },

  //   Track who signed (clients only)
  ndaSignatures: [],

      //  Add creator + all team members
      members: [
  {
    email: user.email,
    role: profile?.role || 'owner',  // ✅ Use their ACTUAL role from profile
    addedAt: new Date()
  },
  ...allOrgMembers
    .filter(m => m.email !== user.email)
    .map(m => ({
      email: m.email,
      role: m.role,  // ✅ Keep their org role (owner/admin/member)
      addedAt: new Date()
    }))
],
      settings: {
        privacy: privacy || 'private',
        autoExpiry: autoExpiry || false,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        requireNDA: requireNDA || false,
        enableWatermark: enableWatermark || false,
        allowDownloads: allowDownloads !== false,
        notifyOnView: notifyOnView !== false
      },

      publicAccess: {
        enabled: false,
        shareLink: null,
        requireEmail: true,
        requirePassword: false,
        password: null,
        expiresAt: null,
        viewLimit: null,
        currentViews: 0
      },

      branding: {
        logoUrl: null,
        primaryColor: color || '#8B5CF6',
        companyName: profile?.company_name || null,
        welcomeMessage: 'Welcome to our secure data room',
        coverImageUrl: null
      },

      documentsCount: 0,
      viewsCount: 0,
      teamMembers: allOrgMembers.length || 1,

      visitors: [],
      activityLog: [],

      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date()
    };

    const result = await db.collection('spaces').insertOne(space);
    const spaceId = result.insertedId.toString();

    // Create folders from template (same as before)
    if (template) {
      const TEMPLATE_FOLDERS: Record<string, string[]> = {
        'sales-proposal': [
          'Proposal & Pricing',
          'Case Studies & Testimonials',
          'Product Demos & Specs',
          'Contract & Terms',
          'Company Info & Credentials'
        ],
        'client-portal': [
          'Welcome & Getting Started',
          'Active Contracts & SOWs',
          'Project Deliverables',
          'Invoices & Payments',
          'Support & Resources'
        ],
        'partnership-deal': [
          'Partnership Proposal',
          'Legal & Agreements',
          'Integration & Technical Docs',
          'Marketing & Co-Branding',
          'Pricing & Commission'
        ],
        'rfp-response': [
          'RFP Requirements',
          'Technical Response',
          'Pricing & Budget',
          'Company Qualifications',
          'References & Past Work',
          'Compliance & Certifications'
        ],
        'quick-nda': [
          'NDA Document',
          'Confidential Materials'
        ],
        'employee-onboarding': [
          'Offer Letter & Contract',
          'Company Policies & Handbook',
          'Benefits & Payroll Forms',
          'Training Materials',
          'Equipment & Access'
        ]
      };
      
      const folderNames = TEMPLATE_FOLDERS[template] || ['General Documents'];

      const folders = folderNames.map((folderName, index) => ({
        spaceId,
        name: folderName,
        parentId: null,
        order: index + 1,
        documentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await db.collection('space_folders').insertMany(folders);
      
      console.log(`✅ Created ${folders.length} folders for template "${template}"`);
    }

    console.log(`✅ Space created: "${name}"`);
    console.log(`   - Creator: ${user.email} (${profile?.role || 'owner'})`);
    console.log(`   - Organization: ${userOrgId || 'PERSONAL'}`);
    console.log(`   - Team members added: ${allOrgMembers.length}`);

    return NextResponse.json({
      success: true,
      spaceId: result.insertedId.toString(),
      space: {
        ...space,
        _id: result.insertedId.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create space error:', error);
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    );
  }
}