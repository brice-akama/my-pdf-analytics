// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  isValidName,
  getClientIP,
  getUserAgent,
  checkRateLimit
} from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Get client info
    const clientIP = getClientIP(request)
    const userAgent = getUserAgent(request)
    
    // Rate limiting: Max 3 signup attempts per IP per hour
    if (checkRateLimit(`signup:${clientIP}`, 3, 3600000)) {
      return NextResponse.json(
        { 
          error: 'Too many signup attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    // Extract all fields (support both regular signup and Google OAuth)
    const { firstName, lastName, companyName, email, password, avatar, full_name } = body

    // Sanitize inputs
    const sanitizedFirstName = sanitizeInput(firstName || full_name?.split(' ')[0] || '')
    const sanitizedLastName = sanitizeInput(lastName || full_name?.split(' ').slice(1).join(' ') || '')
    const sanitizedCompanyName = sanitizeInput(companyName || '')
    const sanitizedEmail = sanitizeInput(email || '').toLowerCase()
    const sanitizedAvatar = sanitizeInput(avatar || '')

    // DETAILED VALIDATION - Check each field individually
    const missingFields: string[] = []
    const invalidFields: { field: string; reason: string }[] = []

    // Check firstName
    if (!sanitizedFirstName) {
      missingFields.push('firstName')
    } else if (!isValidName(sanitizedFirstName)) {
      invalidFields.push({
        field: 'firstName',
        reason: 'Invalid first name. Use only letters, spaces, and hyphens (1-100 characters)'
      })
    }

    // Check email
    if (!sanitizedEmail) {
      missingFields.push('email')
    } else if (!isValidEmail(sanitizedEmail)) {
      invalidFields.push({
        field: 'email',
        reason: 'Invalid email address format'
      })
    }

    // Check password (only required for regular signup, not OAuth)
    const isOAuthSignup = !!avatar || !!full_name
    if (!isOAuthSignup) {
      if (!password) {
        missingFields.push('password')
      } else if (!isValidPassword(password)) {
        invalidFields.push({
          field: 'password',
          reason: 'Password must be at least 8 characters with uppercase, lowercase, and number'
        })
      }
    }

    // Check lastName (optional but validate if provided)
    if (sanitizedLastName && !isValidName(sanitizedLastName)) {
      invalidFields.push({
        field: 'lastName',
        reason: 'Invalid last name. Use only letters, spaces, and hyphens (1-100 characters)'
      })
    }

    // Check companyName (optional but validate if provided)
    if (sanitizedCompanyName && !isValidName(sanitizedCompanyName)) {
      invalidFields.push({
        field: 'companyName',
        reason: 'Invalid company name. Use only letters, spaces, and hyphens (1-100 characters)'
      })
    }

    // Return missing fields error
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
          missingFields,
          details: `Please provide: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Return invalid fields error
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid field values',
          code: 'INVALID_FIELDS',
          invalidFields
        },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', sanitizedEmail)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'An account with this email already exists',
          code: 'EMAIL_EXISTS'
        },
        { status: 409 }
      )
    }
    
    // Build full name
    const fullName = `${sanitizedFirstName}${sanitizedLastName ? ' ' + sanitizedLastName : ''}`.trim()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password: password || Math.random().toString(36).slice(-16), // Random password for OAuth users
      email_confirm: true, // Auto-confirm (⚠️ Use with caution in production)
      user_metadata: {
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName || null,
        full_name: fullName,
        company_name: sanitizedCompanyName || null,
        avatar_url: sanitizedAvatar || null
      }
    })
    
    if (authError) {
      // Log error server-side only (don't expose details to client)
      console.error('Signup error:', {
        message: authError.message,
        status: authError.status,
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      })
      
      // Return generic error to client (security best practice)
      return NextResponse.json(
        { 
          error: 'Failed to create account. Please try again.',
          code: 'SIGNUP_FAILED'
        },
        { status: 500 }
      )
    }
    
    // Create profile in database
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email: sanitizedEmail,
        full_name: fullName,
        avatar_url: sanitizedAvatar || null,
        company_name: sanitizedCompanyName || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' })
    } catch (upsertErr) {
      console.error('Failed to create profile:', upsertErr)
    }

    // Log successful signup in audit log
    await supabaseAdmin.from('audit_log').insert({
      user_id: authData.user.id,
      action: 'signup',
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: {
        email: sanitizedEmail,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName || null,
        company_name: sanitizedCompanyName || null,
        signup_method: isOAuthSignup ? 'oauth' : 'email'
      }
    })
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName
        }
      },
      { status: 201 }
    )
    
  } catch (error) {
    // Log error server-side only
    console.error('Signup error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    // Return generic error to client
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}