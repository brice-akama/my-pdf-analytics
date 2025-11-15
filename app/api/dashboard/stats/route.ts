// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Get all user's documents
    const documents = await db.collection('documents')
      .find({ userId: user.id })
      .toArray();

    const documentIds = documents.map(doc => doc._id);

    // Get all shares for user's documents
    const shares = await db.collection('shares')
      .find({ 
        userId: user.id,
        documentId: { $in: documentIds }
      })
      .toArray();

    // Calculate aggregate stats
    const totalViews = shares.reduce((sum, share) => 
      sum + (share.tracking?.views || 0), 0
    );

    const uniqueViewers = new Set(
      shares.flatMap(share => share.tracking?.uniqueViewers || [])
    ).size;

    const totalDownloads = shares.reduce((sum, share) => 
      sum + (share.tracking?.downloads || 0), 0
    );

    const totalTimeSpent = shares.reduce((sum, share) => 
      sum + (share.tracking?.totalTimeSpent || 0), 0
    );

    const averageTimeSpent = totalViews > 0 
      ? Math.round(totalTimeSpent / totalViews) 
      : 0;

    const activeShares = shares.filter(share => 
      share.active && 
      (!share.expiresAt || new Date(share.expiresAt) > new Date())
    ).length;

    // Calculate engagement rate
    // Engagement = (unique viewers / total views) * 100
    // Also factor in time spent and downloads
    let engagementScore = 0;
    if (totalViews > 0) {
      const viewerEngagement = (uniqueViewers / totalViews) * 100;
      const timeEngagement = Math.min((averageTimeSpent / 60) * 10, 50); // Max 50 points
      const downloadEngagement = totalDownloads > 0 ? 20 : 0; // 20 points if downloads
      engagementScore = Math.round((viewerEngagement + timeEngagement + downloadEngagement) / 2);
    }

    // Get stats from last week for trends
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekShares = shares.filter(share => 
      share.createdAt && new Date(share.createdAt) >= lastWeek
    );

    const lastWeekViews = lastWeekShares.reduce((sum, share) => 
      sum + (share.tracking?.views || 0), 0
    );

    const lastWeekDownloads = lastWeekShares.reduce((sum, share) => 
      sum + (share.tracking?.downloads || 0), 0
    );

    // Calculate trends (percentage change from previous week)
    const previousWeekStart = new Date(lastWeek);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousWeekShares = shares.filter(share => 
      share.createdAt && 
      new Date(share.createdAt) >= previousWeekStart && 
      new Date(share.createdAt) < lastWeek
    );

    const previousWeekViews = previousWeekShares.reduce((sum, share) => 
      sum + (share.tracking?.views || 0), 0
    );

    const previousWeekDownloads = previousWeekShares.reduce((sum, share) => 
      sum + (share.tracking?.downloads || 0), 0
    );

    const viewsChange = previousWeekViews > 0 
      ? Math.round(((lastWeekViews - previousWeekViews) / previousWeekViews) * 100)
      : lastWeekViews > 0 ? 100 : 0;

    const downloadsChange = previousWeekDownloads > 0
      ? Math.round(((lastWeekDownloads - previousWeekDownloads) / previousWeekDownloads) * 100)
      : lastWeekDownloads > 0 ? 100 : 0;

    // Engagement trend (simplified)
    const engagementChange = Math.round((viewsChange + downloadsChange) / 2);

    // Get recent activity from analytics logs
    const recentLogs = await db.collection('analytics_logs')
      .find({ 
        userId: user.id,
        action: { $in: ['document_viewed', 'download', 'share_created'] }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const recentActivity = await Promise.all(
      recentLogs.map(async (log) => {
        const document = documents.find(doc => 
          doc._id.toString() === log.documentId
        );

        return {
          id: log._id.toString(),
          type: log.action === 'document_viewed' ? 'view' as const : 
                log.action === 'download' ? 'download' as const : 
                'share' as const,
          documentName: document?.originalFilename || 'Unknown Document',
          timestamp: log.timestamp.toISOString(),
          viewer: log.email || (log.viewerId ? 'Anonymous' : undefined),
        };
      })
    );

    // Return comprehensive stats
    return NextResponse.json({
      success: true,
      stats: {
        totalDocuments: documents.length,
        totalViews,
        uniqueViewers,
        totalDownloads,
        averageEngagement: Math.min(engagementScore, 100), // Cap at 100%
        averageTimeSpent,
        activeShares,
        recentActivity,
        trending: {
          viewsChange,
          downloadsChange,
          engagementChange,
        },
        // Additional details
        details: {
          documentsThisWeek: documents.filter(doc => 
            doc.createdAt && new Date(doc.createdAt) >= lastWeek
          ).length,
          sharesThisWeek: lastWeekShares.length,
          totalShares: shares.length,
          averageViewsPerDocument: documents.length > 0 
            ? Math.round(totalViews / documents.length) 
            : 0,
        }
      }
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}