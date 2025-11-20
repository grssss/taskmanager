import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Helper function to require an environment variable.
 * Throws an error if the value is undefined, otherwise returns it as a string.
 * This ensures TypeScript knows the value is defined after this check.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const supabaseUrl = requireEnv(
  'PROD_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL',
  process.env.PROD_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
)

const serviceRoleKey = requireEnv(
  'PROD_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY',
  process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)

export function createServerSupabaseClient() {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
