'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { WorkspaceState, defaultWorkspaceState } from './types'
import { ensureWorkspaceState } from './migrations'

export function useWorkspaceStorage(): [
  WorkspaceState,
  (value: WorkspaceState | ((prev: WorkspaceState) => WorkspaceState)) => void,
  boolean,
  { syncing: boolean; error: string | null; lastSynced: Date | null; migrated: boolean }
] {
  const { user } = useAuth()
  const [state, setState] = useState<WorkspaceState>(defaultWorkspaceState())
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [migrated, setMigrated] = useState(false)
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const currentStateRef = useRef<WorkspaceState>(defaultWorkspaceState())
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load data from Supabase when user logs in
  useEffect(() => {
    isMountedRef.current = true
    // Reset hasLoaded when user changes
    hasLoadedRef.current = false

    async function loadData() {
      // Only load once per user session
      if (hasLoadedRef.current) {
        return
      }
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('workspace_state, app_state, schema_version')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase error details:', error)

          if (error.code === 'PGRST116') {
            // No data found, check localStorage for migration
            const localData = localStorage.getItem('kanban-state')
            if (localData) {
              try {
                const parsed = JSON.parse(localData)
                const { state: migratedState, migrated: wasMigrated } = ensureWorkspaceState(parsed)

                console.log('Migrating data from localStorage to Supabase...')
                const { error: insertError } = await supabase
                  .from('user_data')
                  .insert({
                    user_id: user.id,
                    workspace_state: migratedState,
                    schema_version: 2,
                  } as any)

                if (insertError) {
                  console.error('Failed to insert data:', insertError)
                } else if (isMountedRef.current) {
                  setState(migratedState)
                  currentStateRef.current = migratedState
                  setMigrated(wasMigrated)
                  // Clear localStorage after successful migration
                  localStorage.removeItem('kanban-state')
                  console.log('Data migrated successfully and localStorage cleared!')
                }
              } catch (e) {
                console.error('Failed to migrate localStorage data:', e)
              }
            } else {
              // No local data either, insert initial value
              console.log('Creating new user data record...')
              const initialState = defaultWorkspaceState()
              const { error: insertError } = await supabase
                .from('user_data')
                .insert({
                  user_id: user.id,
                  workspace_state: initialState,
                  schema_version: 2,
                } as any)

              if (insertError) {
                console.error('Failed to create initial data:', insertError)
              } else if (isMountedRef.current) {
                setState(initialState)
                currentStateRef.current = initialState
              }
            }
          } else {
            console.error('Error loading data from Supabase:', error)
          }
        } else if (data && isMountedRef.current) {
          // Check schema version and migrate if needed
          const workspaceState = (data as any).workspace_state
          const appState = (data as any).app_state
          const schemaVersion = (data as any).schema_version || 1

          let loadedState: WorkspaceState
          let wasMigrated = false

          if (workspaceState && schemaVersion >= 2) {
            // New format already exists
            loadedState = workspaceState
            console.log('Loaded WorkspaceState from Supabase')
          } else if (appState) {
            // Old format - migrate it
            console.log('Migrating AppState to WorkspaceState...')
            const result = ensureWorkspaceState(appState)
            loadedState = result.state
            wasMigrated = result.migrated

            // Save migrated state back to Supabase
            if (wasMigrated) {
              await supabase
                .from('user_data')
                .update({
                  workspace_state: loadedState,
                  schema_version: 2,
                  state_backup: appState, // Backup old state
                  migrated_at: new Date().toISOString(),
                } as any)
                .eq('user_id', user.id)
              console.log('Migration saved to Supabase')
            }
          } else {
            // No data at all
            loadedState = defaultWorkspaceState()
          }

          setState(loadedState)
          currentStateRef.current = loadedState
          setMigrated(wasMigrated)
          localStorage.removeItem('kanban-state')
          console.log('Data loaded from Supabase successfully!')
        }
      } catch (err) {
        console.error('Unexpected error loading data:', err)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          hasLoadedRef.current = true
        }
      }
    }

    loadData()

    return () => {
      isMountedRef.current = false
    }
  }, [user])

  // Save data to Supabase
  const saveToSupabase = useCallback(
    async (stateToSave?: WorkspaceState) => {
      if (!user) return

      const dataToSave = stateToSave || currentStateRef.current
      setSyncing(true)
      setSyncError(null)

      try {
        const { error } = await (supabase as any)
          .from('user_data')
          .update({
            workspace_state: dataToSave,
            schema_version: 2,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error saving to Supabase:', error)
          setSyncError(error.message || 'Failed to sync data')
        } else {
          setLastSynced(new Date())
          setSyncError(null)
          console.log('WorkspaceState saved to Supabase successfully')
        }
      } catch (err) {
        console.error('Unexpected error saving data:', err)
        setSyncError(err instanceof Error ? err.message : 'Failed to sync data')
      } finally {
        setSyncing(false)
      }
    },
    [user]
  )

  // Debounced save - triggers 2 seconds after last change
  const triggerDebouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Debounced save triggered')
      saveToSupabase()
    }, 2000) // Save 2 seconds after last change
  }, [saveToSupabase])

  // Save when page becomes hidden (tab switch, minimize, close)
  useEffect(() => {
    if (!user || !hasLoadedRef.current) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('Page hidden - triggering immediate save')
        // Clear any pending debounced save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }

        // Use sendBeacon for reliable save during page unload
        try {
          const blob = new Blob([JSON.stringify({
            userId: user.id,
            workspaceState: currentStateRef.current
          })], { type: 'application/json' })

          const success = navigator.sendBeacon('/api/save-state', blob)
          console.log('sendBeacon result:', success)

          // Fallback to regular save if sendBeacon fails
          if (!success) {
            saveToSupabase(currentStateRef.current)
          }
        } catch (error) {
          console.error('sendBeacon failed, using fallback:', error)
          saveToSupabase(currentStateRef.current)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, saveToSupabase])

  // Custom setState that updates local state immediately and triggers debounced save
  const setStateAndSync = useCallback(
    (value: WorkspaceState | ((prev: WorkspaceState) => WorkspaceState)) => {
      setState((prev) => {
        const newState = typeof value === 'function' ? value(prev) : value
        // Update ref for saves
        currentStateRef.current = newState
        // Trigger debounced save
        triggerDebouncedSave()
        return newState
      })
    },
    [triggerDebouncedSave]
  )

  return [state, setStateAndSync, loading, { syncing, error: syncError, lastSynced, migrated }]
}
