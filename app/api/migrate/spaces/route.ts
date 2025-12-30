// app/api/migrate/spaces/route.ts
// Run this ONCE to add new fields to existing spaces

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    //   Security: Only allow in development or with admin token
    const authHeader = request.headers.get('Authorization');
    const isDevelopment = process.env.NODE_ENV === 'development';
    const validAdminToken = authHeader === `Bearer ${process.env.ADMIN_MIGRATION_TOKEN}`;
    
    if (!isDevelopment && !validAdminToken) {
      return NextResponse.json({ 
        error: 'Unauthorized - Migration only allowed in development or with admin token' 
      }, { status: 401 });
    }

    const db = await dbPromise;
    
    console.log('🔄 Starting space schema migration...');
    
    // Get all spaces that don't have the new fields
    const spacesCollection = db.collection('spaces');
    const documentsCollection = db.collection('documents');
    
    // ✅ Step 1: Add default publicAccess to all spaces
    const spacesResult = await spacesCollection.updateMany(
      { publicAccess: { $exists: false } }, // Only update spaces without this field
      {
        $set: {
          publicAccess: {
            enabled: false,
            shareLink: null,
            requireEmail: true,
            requirePassword: false,
            password: null,
            expiresAt: null,
            viewLimit: null,
            currentViews: 0
          }
        }
      }
    );
    
    console.log(`✅ Updated ${spacesResult.modifiedCount} spaces with publicAccess`);
    
    // ✅ Step 2: Add default branding to all spaces
    const brandingResult = await spacesCollection.updateMany(
      { branding: { $exists: false } },
      {
        $set: {
          branding: {
            logoUrl: null,
            primaryColor: '#6366f1', // Default purple
            companyName: null,
            welcomeMessage: 'Welcome to our secure data room',
            coverImageUrl: null
          }
        }
      }
    );
    
    console.log(`✅ Updated ${brandingResult.modifiedCount} spaces with branding`);
    
    // ✅ Step 3: Initialize empty visitors array
    const visitorsResult = await spacesCollection.updateMany(
      { visitors: { $exists: false } },
      {
        $set: {
          visitors: []
        }
      }
    );
    
    console.log(`✅ Updated ${visitorsResult.modifiedCount} spaces with visitors array`);
    
    // ✅ Step 4: Initialize empty activity log
    const activityResult = await spacesCollection.updateMany(
      { activityLog: { $exists: false } },
      {
        $set: {
          activityLog: []
        }
      }
    );
    
    console.log(`✅ Updated ${activityResult.modifiedCount} spaces with activityLog`);
    
    // ✅ Step 5: Add publicPermissions to all documents
    const docsResult = await documentsCollection.updateMany(
      { publicPermissions: { $exists: false } },
      {
        $set: {
          publicViews: 0,
          uniqueVisitors: [],
          lastPublicView: null,
          publicPermissions: {
            visible: true,           // Show in portal by default
            requirePassword: false,  // No extra password by default
            allowDownload: true,     // Allow downloads by default
            watermark: false         // No watermark by default
          }
        }
      }
    );
    
    console.log(`✅ Updated ${docsResult.modifiedCount} documents with publicPermissions`);
    
    // ✅ Step 6: Create visitor_sessions collection (if it doesn't exist)
    const collections = await db.listCollections().toArray();
    const sessionCollectionExists = collections.some(c => c.name === 'visitor_sessions');
    
    if (!sessionCollectionExists) {
      await db.createCollection('visitor_sessions');
      console.log('✅ Created visitor_sessions collection');
      
      // Add indexes for better performance
      await db.collection('visitor_sessions').createIndexes([
        { key: { spaceId: 1 } },
        { key: { visitorId: 1 } },
        { key: { isActive: 1 } },
        { key: { startTime: -1 } }
      ]);
      console.log('✅ Added indexes to visitor_sessions');
    } else {
      console.log('✅ visitor_sessions collection already exists');
    }
    
    // ✅ Summary
    const summary = {
      spacesUpdated: {
        publicAccess: spacesResult.modifiedCount,
        branding: brandingResult.modifiedCount,
        visitors: visitorsResult.modifiedCount,
        activityLog: activityResult.modifiedCount
      },
      documentsUpdated: docsResult.modifiedCount,
      collectionsCreated: !sessionCollectionExists ? ['visitor_sessions'] : [],
      totalSpaces: await spacesCollection.countDocuments(),
      totalDocuments: await documentsCollection.countDocuments()
    };
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Summary:', summary);
    
    return NextResponse.json({
      success: true,
      message: 'Schema migration completed successfully',
      summary
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Check migration status
export async function GET(request: NextRequest) {
  try {
    const db = await dbPromise;
    
    // Count spaces with/without new fields
    const totalSpaces = await db.collection('spaces').countDocuments();
    const spacesWithPublicAccess = await db.collection('spaces').countDocuments({
      publicAccess: { $exists: true }
    });
    const spacesWithBranding = await db.collection('spaces').countDocuments({
      branding: { $exists: true }
    });
    
    const totalDocuments = await db.collection('documents').countDocuments();
    const documentsWithPublicPermissions = await db.collection('documents').countDocuments({
      publicPermissions: { $exists: true }
    });
    
    const collections = await db.listCollections().toArray();
    const hasVisitorSessions = collections.some(c => c.name === 'visitor_sessions');
    
    const needsMigration = 
      spacesWithPublicAccess < totalSpaces ||
      spacesWithBranding < totalSpaces ||
      documentsWithPublicPermissions < totalDocuments ||
      !hasVisitorSessions;
    
    return NextResponse.json({
      success: true,
      needsMigration,
      status: {
        spaces: {
          total: totalSpaces,
          withPublicAccess: spacesWithPublicAccess,
          withBranding: spacesWithBranding,
          needsUpdate: totalSpaces - Math.min(spacesWithPublicAccess, spacesWithBranding)
        },
        documents: {
          total: totalDocuments,
          withPublicPermissions: documentsWithPublicPermissions,
          needsUpdate: totalDocuments - documentsWithPublicPermissions
        },
        collections: {
          hasVisitorSessions
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}