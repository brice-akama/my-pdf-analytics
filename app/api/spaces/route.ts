 

// app/api/spaces/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getTeamMemberIds } from '../lib/teamHelpers'
import { checkAccess } from '@/lib/checkAccess'





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

    console.log(`🔍 Fetching spaces for user: ${user.email}`);
    console.log(`   - Organization: ${userOrgId || 'NONE (personal)'}`);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0');
    const skip = (page - 1) * limit;
    const searchQuery = searchParams.get('search') || '';
    const searchRegex = searchQuery ? new RegExp(searchQuery, 'i') : null;

    const searchCondition = searchRegex
      ? { $or: [{ name: searchRegex }, { description: searchRegex }] }
      : {};

    // ─────────────────────────────────────────────────────────────────
    // THE ONLY RULE THAT MATTERS:
    // A space is visible to a user if they are:
    //   (a) the creator (userId === user.id), OR
    //   (b) explicitly listed in the members array (members.email === user.email)
    //
    // Org membership alone does NOT grant visibility.
    // ─────────────────────────────────────────────────────────────────
    const visibilityQuery = {
      $or: [
        { userId: user.id },
        { 'members.email': user.email },
      ],
    };

    const finalQuery = searchRegex
      ? { $and: [visibilityQuery, searchCondition] }
      : visibilityQuery;

    const cursor = db.collection('spaces').find(finalQuery).sort({ updatedAt: -1 });

    const allRawSpaces = limit > 0
      ? await cursor.skip(skip).limit(limit).toArray()
      : await cursor.toArray();

    console.log(`✅ Found ${allRawSpaces.length} spaces visible to ${user.email}`);

    // ── Format & split into owned vs member ───────────────────────────
     // Fetch real view counts from activityLogs for all spaces
const spaceIds = allRawSpaces.map(s => s._id)
const viewCounts = await db.collection('activityLogs').aggregate([
  {
    $match: {
      spaceId: { $in: spaceIds },
      event: { $in: ['document_view', 'view', 'portal_enter', 'document_open'] }
    }
  },
  {
    $group: {
      _id: '$spaceId',
      count: { $sum: 1 }
    }
  }
]).toArray()

// Build a lookup map
const viewCountMap: Record<string, number> = {}
for (const vc of viewCounts) {
  viewCountMap[vc._id.toString()] = vc.count
}

const ownedSpaces: any[] = []
const memberSpaces: any[] = []

for (const space of allRawSpaces) {
      const isCreator = space.userId === user.id;
      const member = space.members?.find((m: any) => m.email === user.email);

      if (isCreator) {
        // User created this space — full owner access
        ownedSpaces.push({
          _id: space._id.toString(),
          name: space.name,
          description: space.description || '',
          type: space.type || 'custom',
          status: space.status || 'active',
          template: space.template,
          color: space.color || '#8B5CF6',
          organizationId: space.organizationId || null,
          createdBy: space.createdBy || space.userId,
          owner: { name: user.email, email: user.email },
          documentsCount: space.documentsCount || 0,
          teamMembers: space.teamMembers || space.members?.length || 1,
           viewsCount: viewCountMap[space._id.toString()] || 0,
          lastActivity: space.lastActivity || space.updatedAt || space.createdAt,
          createdAt: space.createdAt,
          permissions: { canView: true, canEdit: true, canShare: true, canDownload: true },
          isOwner: true,
          role: 'owner',
        });
      } else if (member) {
        // User was explicitly invited — use their assigned role
        const role = member.role || 'viewer';
        memberSpaces.push({
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
           viewsCount: viewCountMap[space._id.toString()] || 0,
          lastActivity: space.lastActivity || space.updatedAt || space.createdAt,
          createdAt: space.createdAt,
          permissions: {
            canView: true,
            canEdit: role === 'editor' || role === 'admin',
            canShare: role === 'admin',
            canDownload: space.settings?.allowDownloads !== false,
          },
          isOwner: false,
          role,
        });
      }
      // If neither creator nor member — space is NOT included (the fix)
    }

    const combined = [...ownedSpaces, ...memberSpaces];
    const totalSpaces = combined.length;
    const totalPages = limit > 0 ? Math.ceil(totalSpaces / limit) : 1;

    console.log(`✅ Returning ${ownedSpaces.length} owned + ${memberSpaces.length} member spaces`);

    return NextResponse.json({
      success: true,
      spaces: combined,
      pagination: limit > 0
        ? { page, limit, totalSpaces, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 }
        : null,
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
    const access = await checkAccess(request)
    if (!access.ok) return access.response

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

    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const userOrgId = profile?.organization_id;

     

    // ── Plan limit: max spaces ────────────────────────────────────────
    const { limits } = access
    if (limits.maxSpaces !== -1) {
      const currentSpaceCount = await db.collection('spaces').countDocuments({
        userId: user.id,
        status: { $ne: 'deleted' },
      })
      if (currentSpaceCount >= limits.maxSpaces) {
        return NextResponse.json(
          {
            error: 'SPACE_LIMIT_REACHED',
            limit: limits.maxSpaces,
            plan: access.plan,
          },
          { status: 403 }
        )
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Only the creator is added to members on creation.
    // Other team members must be explicitly invited via /contacts.
    // This ensures nobody sees a space they weren't invited to.
    // ─────────────────────────────────────────────────────────────────
    const space = {
      userId: user.id,
      createdBy: user.id,
      organizationId: userOrgId || null,

      name: name.trim(),
      description: description || '',
      type: type || 'custom',
      template: template || null,
      color: color || '#8B5CF6',
      active: true,
      status: 'active',

      ndaSettings: {
        enabled: false,
        ndaDocumentId: null,
        ndaDocumentName: null,
        ndaDocumentUrl: null,
        signingRequired: true,
        uploadedAt: null,
        uploadedBy: null,
      },

      ndaSignatures: [],

      // ✅ ONLY the creator — no auto-adding org members
      members: [
        {
          email: user.email,
          role: profile?.role || 'owner',
          addedAt: new Date(),
        },
      ],

      settings: {
        privacy: privacy || 'private',
        autoExpiry: autoExpiry || false,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        requireNDA: requireNDA || false,
        enableWatermark: enableWatermark || false,
        allowDownloads: allowDownloads !== false,
        notifyOnView: notifyOnView !== false,
      },

      publicAccess: {
        enabled: false,
        shareLink: null,
        requireEmail: true,
        requirePassword: false,
        password: null,
        expiresAt: null,
        viewLimit: null,
        currentViews: 0,
      },

      branding: {
        logoUrl: null,
        primaryColor: color || '#8B5CF6',
        companyName: profile?.company_name || null,
        welcomeMessage: 'Welcome to our secure data room',
        coverImageUrl: null,
      },

      documentsCount: 0,
      viewsCount: 0,
      teamMembers: 1, // just the creator

      visitors: [],
      activityLog: [],

      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
    };

    const result = await db.collection('spaces').insertOne(space);
    const spaceId = result.insertedId.toString();

    // Create folders from template
    if (template) {
      const TEMPLATE_FOLDERS: Record<string, string[]> = {
        'sales-proposal': [
          'Proposal & Pricing',
          'Case Studies & Testimonials',
          'Product Demos & Specs',
          'Contract & Terms',
          'Company Info & Credentials',
        ],
        'client-portal': [
          'Welcome & Getting Started',
          'Active Contracts & SOWs',
          'Project Deliverables',
          'Invoices & Payments',
          'Support & Resources',
        ],
        'partnership-deal': [
          'Partnership Proposal',
          'Legal & Agreements',
          'Integration & Technical Docs',
          'Marketing & Co-Branding',
          'Pricing & Commission',
        ],
        'rfp-response': [
          'RFP Requirements',
          'Technical Response',
          'Pricing & Budget',
          'Company Qualifications',
          'References & Past Work',
          'Compliance & Certifications',
        ],
        'quick-nda': ['NDA Document', 'Confidential Materials'],
        'employee-onboarding': [
          'Offer Letter & Contract',
          'Company Policies & Handbook',
          'Benefits & Payroll Forms',
          'Training Materials',
          'Equipment & Access',
        ],
      };

      const folderNames = TEMPLATE_FOLDERS[template] || ['General Documents'];
      const folders = folderNames.map((folderName, index) => ({
        spaceId,
        name: folderName,
        parentId: null,
        order: index + 1,
        documentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.collection('space_folders').insertMany(folders);
      console.log(`✅ Created ${folders.length} folders for template "${template}"`);
    }

    console.log(`✅ Space created: "${name}" by ${user.email}`);

    return NextResponse.json({
      success: true,
      spaceId: result.insertedId.toString(),
      space: {
        ...space,
        _id: result.insertedId.toString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create space error:', error);
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    );
  }
}