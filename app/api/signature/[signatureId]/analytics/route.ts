// app/api/signature/[signatureId]/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // Get all views
    const views = await db.collection("signature_views")
      .find({ signatureId: signatureId })
      .sort({ timestamp: 1 })
      .toArray();

    // Get time tracking
    const timeTracking = await db.collection("signature_time_tracking")
      .find({ signatureId: signatureId })
      .toArray();

    // Aggregate time per page
    const timePerPage: { [key: number]: number } = {};
    timeTracking.forEach(t => {
      if (t.page !== null && t.page !== undefined) {
        timePerPage[t.page] = (timePerPage[t.page] || 0) + (t.timeSpent || 0);
      }
    });

    // Parse device and browser from user agents
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

    const devices: { [key: string]: number } = {};
    const browsers: { [key: string]: number } = {};

    views.forEach(v => {
      if (v.userAgent) {
        const { device, browser } = parseUserAgent(v.userAgent);
        devices[device] = (devices[device] || 0) + 1;
        browsers[browser] = (browsers[browser] || 0) + 1;
      }
    });

    // Views over time (hourly)
    const viewsByHour: { [key: number]: number } = {};
    views.forEach(v => {
      const hour = new Date(v.timestamp).getHours();
      viewsByHour[hour] = (viewsByHour[hour] || 0) + 1;
    });

    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      views: viewsByHour[hour] || 0,
    }));

    // Get unique IPs for location tracking
    const uniqueIPs = [...new Set(views.map(v => v.ip).filter(Boolean))];
    
    // Location data (you'd need to call geolocation API for each IP)
    const locationData = await Promise.all(
      uniqueIPs.slice(0, 10).map(async (ip) => {
        try {
          const response = await fetch(`https://ipapi.co/${ip}/json/`);
          if (response.ok) {
            const data = await response.json();
            return {
              city: data.city || 'Unknown',
              country: data.country_name || 'Unknown',
              views: views.filter(v => v.ip === ip).length,
              lat: data.latitude || 0,
              lng: data.longitude || 0,
            };
          }
        } catch (error) {
          console.error('Location lookup failed:', error);
        }
        return null;
      })
    );

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews: views.length,
        totalTimeSpent: timeTracking.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
        timePerPage: Object.entries(timePerPage).map(([page, time]) => ({
          page: parseInt(page),
          timeSpent: time,
        })),
        deviceBreakdown: Object.entries(devices).map(([device, count]) => ({
          device,
          count,
          percentage: Math.round((count / views.length) * 100),
        })),
        browserBreakdown: Object.entries(browsers).map(([browser, count]) => ({
          browser,
          count,
        })),
        hourlyActivity,
        geographicData: locationData.filter(Boolean),
        viewHistory: views.map(v => ({
          timestamp: v.timestamp,
          page: v.page,
          ip: v.ip,
          userAgent: v.userAgent,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}