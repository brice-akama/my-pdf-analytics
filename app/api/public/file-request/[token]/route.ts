//app/api/public/file-request/[token]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"

export const dynamic = 'force-dynamic'

// GET - Fetch public file request info (NO AUTH REQUIRED)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    // ✅ Next.js 15: params is now a Promise
    const { token } = await context.params
    
    console.log('🔍 [PUBLIC] Looking for shareToken:', token.substring(0, 20) + '...')
    
    const db = await dbPromise
    const request = await db.collection("fileRequests").findOne({
      shareToken: token
    })

    if (!request) {
      console.log('❌ [PUBLIC] Request not found')
      return NextResponse.json({ 
        success: false,
        error: "This file request link is invalid or has expired." 
      }, { status: 404 })
    }

    console.log('✅ [PUBLIC] Found request:', request.title)

    return NextResponse.json({
      success: true,
      request: {
        title: request.title,
        description: request.description || "",
        expectedFiles: request.expectedFiles || 1,
        dueDate: request.dueDate,
        status: request.status,
      }
    })
  } catch (error) {
    console.error("❌ [PUBLIC] Error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to load file request. Please try again." 
    }, { status: 500 })
  }
}