import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

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

    const supabase = createServerSupabaseClient()

    const now = new Date().toISOString()
    const updateData: Database['public']['Tables']['user_data']['Update'] = {
      updated_at: now,
    }

    if (workspaceState) {
      updateData.workspace_state = workspaceState
      updateData.schema_version = 2
      updateData.app_state = appState ?? workspaceState
      if (appState) {
        updateData.state_backup = appState
      }
      updateData.migrated_at = now
    } else if (appState) {
      updateData.app_state = appState
      updateData.schema_version = updateData.schema_version ?? 1
    }

    const { error } = await supabase
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
