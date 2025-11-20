import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const isProduction = process.env.NODE_ENV === 'production'

function resolveDevSupabaseUrl(candidate?: string) {
  if (!candidate) return candidate
  if (typeof window === 'undefined') return candidate

  try {
    const parsed = new URL(candidate)
    const isLocalhostHost = /(localhost|127\.0\.0\.1)/i.test(parsed.hostname)

    // Only rewrite if accessing from a different hostname (e.g., mobile device on same network)
    // Otherwise, keep the original localhost URL
    if (!isLocalhostHost) {
      return candidate
    }

    const host = window.location.hostname
    const isAccessingFromLocalhost = /(localhost|127\.0\.0\.1)/i.test(host)
    
    // If accessing from localhost, keep the original URL (don't rewrite)
    if (isAccessingFromLocalhost) {
      return candidate
    }

    // Only rewrite for remote devices (e.g., mobile testing)
    const port = parsed.port || '55321'
    const protocol = parsed.protocol
    const rewritten = `${protocol}//${host}:${port}`

    console.info('[Supabase] Rewriting localhost URL for remote device:', rewritten)
    return rewritten
  } catch (error) {
    console.warn('Failed to rewrite Supabase URL for mobile testing:', error)
    return candidate
  }
}

// Prefer explicit production creds when building prod bundle, otherwise fall back to local defaults.
const supabaseUrl = (() => {
  const candidate = isProduction
    ? process.env.PROD_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROD_SUPABASE_URL

  const resolved = isProduction ? candidate : resolveDevSupabaseUrl(candidate)
  
  // Debug logging in development
  if (!isProduction && typeof window !== 'undefined') {
    console.log('[Supabase Config]', {
      candidate,
      resolved,
      windowHostname: window.location.hostname,
      envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
  }
  
  return resolved
})()

const supabaseAnonKey = isProduction
  ? process.env.PROD_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.PROD_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Debug logging in development
if (!isProduction && typeof window !== 'undefined') {
  console.log('[Supabase Client]', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    anonKeyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
    expectedUrl: 'http://localhost:55321',
    expectedKeyPrefix: 'sb_publishable_',
    urlMatches: supabaseUrl?.includes('55321'),
    keyMatches: supabaseAnonKey?.startsWith('sb_publishable_'),
  })
  
  // Warn if using wrong configuration
  if (!supabaseUrl?.includes('55321')) {
    console.warn('[Supabase] ⚠️ WARNING: Not using local Supabase instance (port 55321)!', {
      currentUrl: supabaseUrl,
      expectedUrl: 'http://localhost:55321',
    })
  }
  
  if (!supabaseAnonKey?.startsWith('sb_publishable_')) {
    console.warn('[Supabase] ⚠️ WARNING: Not using local Supabase key!', {
      keyPrefix: supabaseAnonKey?.substring(0, 20),
      expectedPrefix: 'sb_publishable_',
    })
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Storage bucket configuration
const BUCKET_NAME = 'card-attachments'

// File upload helper
export async function uploadFile(
  userId: string,
  cardId: string,
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${userId}/${cardId}/${timestamp}_${sanitizedFileName}`

  console.log('[Upload] Starting upload:', {
    bucket: BUCKET_NAME,
    filePath,
    fileName: file.name,
    fileSize: file.size,
    userId,
    cardId,
  })

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[Upload] Error:', {
      message: error.message,
      error: error,
      bucket: BUCKET_NAME,
      filePath,
    })
    return { error: error.message }
  }

  console.log('[Upload] Success:', { path: data.path })

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  console.log('[Upload] Public URL generated:', urlData.publicUrl)

  return { url: urlData.publicUrl, path: data.path }
}

// File delete helper
export async function deleteFile(filePath: string): Promise<{ error?: string }> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (error) {
    return { error: error.message }
  }

  return {}
}
