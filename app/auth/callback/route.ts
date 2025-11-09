import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to home page after successful verification
      return NextResponse.redirect(`${origin}/`)
    }

    // If there's an error, redirect to home with error message
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(`${origin}/?error=verification_failed`)
  }

  // If no code, redirect to home
  return NextResponse.redirect(`${origin}/`)
}
