 // app/api/signature/[signatureId]/route.ts
// app/api/signature/[signatureId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // Get signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
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

    // Parse user agent for device/browser info
    const parseUserAgent = (ua: string) => {
      const isMobile = /Mobile|Android|iPhone/i.test(ua);
      const isTablet = /Tablet|iPad/i.test(ua);
      const device = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';
      
      let browser = 'Unknown';
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      
      return { device, browser };
    };

    const firstView = views.length > 0 ? views[views.length - 1] : null;
    const deviceInfo = firstView ? parseUserAgent(firstView.userAgent || '') : { device: 'Unknown', browser: 'Unknown' };

    // Get location from IP (simplified - you can integrate a real geolocation API)
    const getLocationFromIP = async (ip: string) => {
      try {
        // Using ipapi.co free API (you can replace with your preferred service)
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        if (response.ok) {
          const data = await response.json();
          return {
            city: data.city || 'Unknown',
            country: data.country_name || 'Unknown',
            lat: data.latitude,
            lng: data.longitude,
          };
        }
      } catch (error) {
        console.error('Location lookup failed:', error);
      }
      return { city: 'Unknown', country: 'Unknown', lat: 0, lng: 0 };
    };

    const location = firstView?.ip ? await getLocationFromIP(firstView.ip) : null;

    // Calculate engagement level
    let engagement: 'high' | 'medium' | 'low' = 'low';
    if (signatureRequest.status === 'signed') {
      const timeToSign = new Date(signatureRequest.signedAt).getTime() - new Date(signatureRequest.createdAt).getTime();
      if (timeToSign < 86400000) engagement = 'high'; // < 24 hours
      else if (timeToSign < 604800000) engagement = 'medium'; // < 7 days
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
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        location: location,
        engagement: engagement,
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