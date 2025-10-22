// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase client (for components)
export const supabase = createClientComponentClient()

// Server-side Supabase client with service role (for API routes)
// ONLY use in API routes - NEVER expose service role key to client!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This has full database access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types (for TypeScript)
export type Profile = {
  id: string
  email: string
  first_name: string
  company_name: string | null
  industry: string | null
  company_size: string | null
  use_cases: string[] | null
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type LoginAttempt = {
  id: string
  email: string
  ip_address: string
  attempt_time: string
  success: boolean
  user_agent: string | null
  blocked_until: string | null
}

export type BlockedUser = {
  id: string
  email: string
  blocked_at: string
  blocked_until: string
  reason: string
  ip_address: string | null
  attempt_count: number
}