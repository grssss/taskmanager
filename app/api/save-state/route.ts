import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, appState, workspaceState } = body

    if (!userId || (!appState && !workspaceState)) {
      return NextResponse.json(
        { error: 'Missing userId or state data' },
        { status: 400 }
      )
    }

    // Create a Supabase client for this request
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Support both old appState and new workspaceState
    if (workspaceState) {
      updateData.workspace_state = workspaceState
      updateData.schema_version = 2
    } else if (appState) {
      updateData.app_state = appState
      updateData.schema_version = 1
    }

    // Update the user's data
    const { error } = await (supabase as any)
      .from('user_data')
      .update(updateData)
      .eq('user_id', userId)

    if (error) {
      console.error('Error saving to Supabase:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in save-state API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
