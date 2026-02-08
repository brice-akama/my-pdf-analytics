
// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('🔓 Logout request received');

    const response = NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    );

    // ✅ Clear the token cookie (must match the name used in login!)
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // ✅ Match the login cookie setting
      expires: new Date(0), // Expire immediately
      path: '/',
      maxAge: 0
    });

    console.log('✅ Logout successful, cookie cleared');
    
    return response;

  } catch (error) {
    console.error('❌ Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ Also support GET method for convenience
export async function GET(request: NextRequest) {
  return POST(request);
}