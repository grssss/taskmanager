import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
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

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

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
