// lib/geoip.ts

export interface GeoLocation {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// Free IP geolocation using ip-api.com (15,000 requests/hour)
export async function getLocationFromIP(ip: string): Promise<GeoLocation | null> {
  try {
    // Skip for localhost/private IPs
    if (!ip || ip === 'Unknown' || ip.startsWith('192.168') || ip.startsWith('10.') || ip === '::1' || ip === '127.0.0.1') {
      return null;
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,timezone`);
    const data = await response.json();

    if (data.status === 'success') {
      return {
        city: data.city || 'Unknown',
        region: data.region || '',
        country: data.country || 'Unknown',
        countryCode: data.countryCode || '',
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        timezone: data.timezone || '',
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching geolocation:', error);
    return null;
  }
}