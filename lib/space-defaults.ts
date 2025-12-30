// lib/space-defaults.ts
// Helper functions to ensure all new spaces have the correct schema

export interface PublicAccessSettings {
  enabled: boolean
  shareLink: string | null
  requireEmail: boolean
  requirePassword: boolean
  password: string | null
  expiresAt: Date | null
  viewLimit: number | null
  currentViews: number
}

export interface BrandingSettings {
  logoUrl: string | null
  primaryColor: string
  companyName: string | null
  welcomeMessage: string
  coverImageUrl: string | null
}

export interface Visitor {
  id: string
  email?: string
  ipAddress: string
  userAgent: string
  firstVisit: Date
  lastVisit: Date
  totalViews: number
  documentsViewed: string[]
  timeSpent: number
  location?: {
    country: string
    city: string
  }
}

export interface ActivityLogEntry {
  timestamp: Date
  event: 'view' | 'download' | 'share' | 'invite'
  visitorId: string
  documentId?: string
  details: string
}

export interface DocumentPublicPermissions {
  visible: boolean
  requirePassword: boolean
  allowDownload: boolean
  watermark: boolean
}

// ✅ Default values for new spaces
export function getDefaultPublicAccess(): PublicAccessSettings {
  return {
    enabled: false,
    shareLink: null,
    requireEmail: true,
    requirePassword: false,
    password: null,
    expiresAt: null,
    viewLimit: null,
    currentViews: 0
  };
}

export function getDefaultBranding(companyName?: string): BrandingSettings {
  return {
    logoUrl: null,
    primaryColor: '#6366f1', // Indigo-600
    companyName: companyName || null,
    welcomeMessage: 'Welcome to our secure data room',
    coverImageUrl: null
  };
}

export function getDefaultDocumentPublicPermissions(): DocumentPublicPermissions {
  return {
    visible: true,
    requirePassword: false,
    allowDownload: true,
    watermark: false
  };
}

// ✅ Helper to create a complete space document
export function createSpaceDocument(data: {
  name: string
  description?: string
  type?: string
  template?: string
  ownerId?: string
  ownerEmail?: string
  members?: any[]
  [key: string]: any
}) {
  const now = new Date();
  
  return {
    // Original fields
    name: data.name,
    description: data.description || '',
    type: data.type || 'custom',
    template: data.template || null,
    status: 'active',
    color: data.color || '#6366f1',
    
    // Ownership
    members: data.members || [],
    
    // Counts
    documentsCount: 0,
    viewsCount: 0,
    teamMembers: data.members?.length || 0,
    
    // NEW: Public Access (with defaults)
    publicAccess: getDefaultPublicAccess(),
    
    // NEW: Branding (with defaults)
    branding: getDefaultBranding(data.ownerEmail?.split('@')[0]),
    
    // NEW: Visitor Tracking (empty arrays)
    visitors: [] as Visitor[],
    
    // NEW: Activity Log (empty array)
    activityLog: [] as ActivityLogEntry[],
    
    // Timestamps
    createdAt: now,
    updatedAt: now,
    lastActivity: now,
    
    // Any other custom fields
    ...Object.keys(data)
      .filter(key => ![
        'name', 'description', 'type', 'template', 'ownerId', 
        'ownerEmail', 'members', 'color'
      ].includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {})
  };
}

//   Helper to create a complete document with public permissions
export function createDocumentWithPublicPermissions(documentData: any) {
  return {
    ...documentData,
    
    // Public viewing stats
    publicViews: 0,
    uniqueVisitors: [] as string[],
    lastPublicView: null,
    
    // Public permissions
    publicPermissions: getDefaultDocumentPublicPermissions()
  };
}