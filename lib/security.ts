// lib/security.ts
import { NextRequest } from 'next/server'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML/script tags
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  })
  
  // Trim whitespace
  return sanitized.trim()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return validator.isEmail(email) && email.length <= 254
}

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  return hasUpperCase && hasLowerCase && hasNumber
}

/**
 * Validate name (first name, company name)
 * - 1-100 characters
 * - Letters, spaces, hyphens, apostrophes only
 */
export function isValidName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 100) return false
  
  // Allow letters (any language), spaces, hyphens, apostrophes
  const nameRegex = /^[\p{L}\s'\-]+$/u
  return nameRegex.test(name)
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers (in order of preference)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) return realIP
  if (cfConnectingIP) return cfConnectingIP
  
  // Fallback (should not happen in production)
  return '0.0.0.0'
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown'
}

/**
 * Rate limiting check (simple implementation)
 * Returns true if rate limit exceeded
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, // IP or email
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  if (!record || now > record.resetTime) {
    // Reset counter
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return false
  }
  
  if (record.count >= maxRequests) {
    return true // Rate limit exceeded
  }
  
  // Increment counter
  record.count++
  return false
}

/**
 * Clean up old rate limit records (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}

/**
 * Validate CSRF token (for future implementation)
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  // Constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) return false
  
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    token += characters[randomValues[i] % characters.length]
  }
  
  return token
}

/**
 * Hash sensitive data (for logging purposes - NOT for passwords!)
 */
export function hashData(data: string): string {
  // Simple hash for logging (don't use for passwords!)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}