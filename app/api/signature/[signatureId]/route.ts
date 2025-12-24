 // app/api/signature/[signatureId]/route.ts
// app/api/signature/[signatureId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { parseUserAgent, DeviceInfo } from '@/lib/deviceParser';
import { getLocationFromIP, GeoLocation } from '@/lib/geoip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // ⭐ First try to find by current uniqueId
    let signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    // ⭐ If not found, check if this is an old link from a reassigned document
if (!signatureRequest) {
  // Check if any document was reassigned and this was the original uniqueId
  signatureRequest = await db.collection("signature_requests").findOne({
    'originalRecipient.uniqueId': signatureId,
    wasReassigned: true,
  });

      // ⭐ If found as original recipient, check access permissions
      if (signatureRequest) {
        const { wasReassigned, allowOriginalToView, originalRecipient } = signatureRequest;

        if (wasReassigned) {
          if (!allowOriginalToView) {
            // ⭐ ACCESS DENIED - Original recipient cannot view
            return NextResponse.json(
              { 
                success: false, 
                message: "This document has been reassigned and you no longer have access.",
                wasReassigned: true,
                accessDenied: true,
                newRecipient: {
                  name: signatureRequest.recipientName,
                  email: signatureRequest.recipientEmail,
                }
              },
              { status: 403 }
            );
          } else {
            // ⭐ VIEW-ONLY MODE - Original recipient can view but not sign
            console.log(`👁️ Original recipient viewing document (view-only mode)`);
            
            // Return with viewOnly flag
            const document = await db.collection("documents").findOne({
              _id: new ObjectId(signatureRequest.documentId),
            });

            return NextResponse.json({
              success: true,
              viewOnlyMode: true, // ⭐ Flag for frontend
              wasReassigned: true,
              originalRecipient: originalRecipient,
              currentRecipient: {
                name: signatureRequest.recipientName,
                email: signatureRequest.recipientEmail,
              },
              signature: {
                uniqueId: signatureRequest.uniqueId,
                documentId: signatureRequest.documentId,
                documentName: document?.filename || 'Unknown',
                recipient: signatureRequest.recipient,
                status: signatureRequest.status,
                createdAt: signatureRequest.createdAt,
                viewedAt: signatureRequest.viewedAt,
                signedAt: signatureRequest.signedAt,
                dueDate: signatureRequest.dueDate,
                message: signatureRequest.message,
              },
            });
          }
        }
      }

      // ⭐ Not found at all
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // ⭐ If cancelled (access revoked)
if (signatureRequest.status === 'cancelled' && signatureRequest.wasReassigned) {
  return NextResponse.json(
    { 
      success: false, 
      message: `This document was reassigned to ${signatureRequest.reassignedToName || 'another person'}. Your access has been revoked.`,
      wasReassigned: true,
      accessDenied: true,
    },
    { status: 403 }
  );
}

    // Track view if the document is still pending
    if (signatureRequest.status === 'pending') {
      const userAgent = request.headers.get('user-agent') || '';
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

      // Get geographic location
      const geoLocation = await getLocationFromIP(ipAddress);

      // Parse user agent for device, browser, and OS info
      const deviceInfo: DeviceInfo = parseUserAgent(userAgent);

      await db.collection("signature_requests").updateOne(
        { uniqueId: signatureId },
        {
          $set: {
            status: 'viewed',
            viewedAt: new Date(),
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            userAgent: userAgent,
            ipAddress: ipAddress,
            location: geoLocation ? {
              city: geoLocation.city,
              region: geoLocation.region,
              country: geoLocation.country,
              countryCode: geoLocation.countryCode,
              latitude: geoLocation.latitude,
              longitude: geoLocation.longitude,
              timezone: geoLocation.timezone,
            } : null,
          },
        }
      );
    }

    // Get document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    // Get all views for this signature
    const views = await db.collection("signature_views")
      .find({ signatureId: signatureId })
      .sort({ timestamp: -1 })
      .toArray();

    // Get time tracking
    const timeTracking = await db.collection("signature_time_tracking")
      .find({ signatureId: signatureId })
      .toArray();

    const totalTimeSpent = timeTracking.reduce((sum, t) => sum + (t.timeSpent || 0), 0);

    // Parse user agent for device/browser info for the first view
    const firstView = views.length > 0 ? views[views.length - 1] : null;
    const firstViewDeviceInfo: DeviceInfo = firstView ? parseUserAgent(firstView.userAgent || '') : { device: 'Desktop', browser: 'Unknown', os: 'Unknown' };

    // Get location from IP for the first view
    const firstViewLocation: GeoLocation | null = firstView?.ip ? await getLocationFromIP(firstView.ip) : null;

    // Calculate engagement level
    let engagement: 'high' | 'medium' | 'low' = 'low';
    if (signatureRequest.status === 'signed') {
      const timeToSign = new Date(signatureRequest.signedAt).getTime() - new Date(signatureRequest.createdAt).getTime();
      if (timeToSign < 86400000) engagement = 'high'; // Less than 24 hours
      else if (timeToSign < 604800000) engagement = 'medium'; // Less than 7 days
    } else if (signatureRequest.status === 'viewed') {
      engagement = 'medium';
    }

    return NextResponse.json({
      success: true,
      signature: {
        uniqueId: signatureRequest.uniqueId,
        documentId: signatureRequest.documentId,
        documentName: document?.filename || 'Unknown',
        recipient: signatureRequest.recipient,
        status: signatureRequest.status,
        createdAt: signatureRequest.createdAt,
        viewedAt: signatureRequest.viewedAt,
        signedAt: signatureRequest.signedAt,
        dueDate: signatureRequest.dueDate,
        message: signatureRequest.message,
        totalViews: views.length,
        totalTimeSpent: totalTimeSpent,
        device: firstViewDeviceInfo.device,
        browser: firstViewDeviceInfo.browser,
        os: firstViewDeviceInfo.os,
        location: firstViewLocation,
        engagement: engagement,
         selfieVerification: signatureRequest.selfieVerification || null,  // ⭐ ADD THIS
    selfieVerifiedAt: signatureRequest.selfieVerifiedAt || null,      // ⭐ ADD THIS
    recipientName: signatureRequest.recipientName,
recipientEmail: signatureRequest.recipientEmail,
        viewHistory: views.map(v => ({
          timestamp: v.timestamp,
          page: v.page,
          ip: v.ip,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching signature details:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
