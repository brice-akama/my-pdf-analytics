// lib/deviceParser.ts

export interface DeviceInfo {
  device: 'Mobile' | 'Tablet' | 'Desktop';
  browser: string;
  os: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let device: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    device = 'Mobile';
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';
  else if (ua.includes('trident') || ua.includes('msie')) browser = 'IE';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { device, browser, os };
}

export function calculateTimeSpent(viewedAt: Date | string, signedAt: Date | string): number {
  const viewed = new Date(viewedAt).getTime();
  const signed = new Date(signedAt).getTime();
  return Math.floor((signed - viewed) / 1000); // seconds
}