import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl =
  process.env.PROD_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL

const serviceRoleKey =
  process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase server environment variables. Did you configure the service role key?')
}

export function createServerSupabaseClient() {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
