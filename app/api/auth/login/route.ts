// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  sanitizeInput,
  isValidEmail,
  getClientIP,
  getUserAgent,
  checkRateLimit
} from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Get client info
    const clientIP = getClientIP(request)
    const userAgent = getUserAgent(request)
    
    // Parse request body
    const body = await request.json().catch(() => null)
    
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }
    
    const { email, password } = body
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email || '').toLowerCase()
    
    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address', code: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }
    
    // Check if password provided
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      )
    }
    
    // ==========================================
    // SECURITY CHECK 1: Check if user is blocked
    // ==========================================
    const { data: blockedUser } = await supabaseAdmin
      .from('blocked_users')
      .select('*')
      .eq('email', sanitizedEmail)
      .single()
    
    if (blockedUser && new Date(blockedUser.blocked_until) > new Date()) {
      const hoursLeft = Math.ceil(
        (new Date(blockedUser.blocked_until).getTime() - Date.now()) / (1000 * 60 * 60)
      )
      
      return NextResponse.json(
        {
          error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${hoursLeft} hour(s).`,
          code: 'ACCOUNT_LOCKED',
          blockedUntil: blockedUser.blocked_until
        },
        { status: 403 }
      )
    }
    
    // ==========================================
    // SECURITY CHECK 2: Rate limiting per IP
    // ==========================================
    if (checkRateLimit(`login:${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        {
          error: 'Too many login attempts from this IP. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      )
    }
    
    // ==========================================
    // SECURITY CHECK 3: Count recent failed attempts
    // ==========================================
    const { data: recentAttempts } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .eq('email', sanitizedEmail)
      .eq('success', false)
      .gte('attempt_time', new Date(Date.now() - 3600000).toISOString()) // Last hour
    
    const failedCount = recentAttempts?.length || 0
    
    if (failedCount >= 3) {
      // Block user for 10 hours
      await supabaseAdmin.from('blocked_users').upsert({
        email: sanitizedEmail,
        blocked_until: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        ip_address: clientIP,
        attempt_count: failedCount,
        reason: 'Too many failed login attempts'
      })
      
      return NextResponse.json(
        {
          error: 'Account locked due to multiple failed login attempts. Please try again in 10 hours.',
          code: 'ACCOUNT_LOCKED'
        },
        { status: 403 }
      )
    }
    
    // ==========================================
    // ATTEMPT LOGIN
    // ==========================================
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: sanitizedEmail,
      password: password
    })
    
    // ==========================================
    // LOG LOGIN ATTEMPT
    // ==========================================
    const loginAttemptData = {
      email: sanitizedEmail,
      ip_address: clientIP,
      user_agent: userAgent,
      success: !authError,
      attempt_time: new Date().toISOString()
    }
    
    await supabaseAdmin.from('login_attempts').insert(loginAttemptData)
    
    // ==========================================
    // HANDLE LOGIN FAILURE
    // ==========================================
    if (authError) {
      const remainingAttempts = 3 - (failedCount + 1)
      
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          remainingAttempts: Math.max(0, remainingAttempts),
          warning: remainingAttempts === 0 
            ? 'Your account will be locked after one more failed attempt'
            : remainingAttempts === 1
            ? 'Warning: Only 1 attempt remaining before account lock'
            : null
        },
        { status: 401 }
      )
    }
    
    // ==========================================
    // LOGIN SUCCESSFUL
    // ==========================================
    
    // Clear any previous blocks
    await supabaseAdmin
      .from('blocked_users')
      .delete()
      .eq('email', sanitizedEmail)
    
    // Log successful login in audit log
    await supabaseAdmin.from('audit_log').insert({
      user_id: authData.user.id,
      action: 'login',
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: {
        email: sanitizedEmail,
        login_time: new Date().toISOString()
      }
    })
    
    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile: profile
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        }
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}