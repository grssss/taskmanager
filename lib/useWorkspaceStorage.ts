'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { WorkspaceState, defaultWorkspaceState } from './types'
import { ensureWorkspaceState } from './migrations'
import { autoFixWorkspaceState, analyzeWorkspaceState } from './dataRecovery'
import type { Database } from './database.types'

type UserDataInsert = Database['public']['Tables']['user_data']['Insert']
type UserDataUpdate = Database['public']['Tables']['user_data']['Update']

export function useWorkspaceStorage(): [
  WorkspaceState,
  (value: WorkspaceState | ((prev: WorkspaceState) => WorkspaceState)) => void,
  boolean,
  { syncing: boolean; error: string | null; lastSynced: Date | null; migrated: boolean },
  { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; saveNow: () => void }
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

  // History management for undo/redo
  const historyRef = useRef<WorkspaceState[]>([])
  const historyIndexRef = useRef(-1)
  const isUndoRedoRef = useRef(false)

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
        // Try to load both workspace_state (new) and app_state (legacy) data
        const { data, error } = await supabase
          .from('user_data')
          .select('workspace_state, app_state, schema_version, state_backup')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase error loading data:', {
            code: error.code,
            message: error.message,
            details: error.details,
          })

          if (error.code === 'PGRST116') {
            // No data found, check localStorage for migration
            const localData = localStorage.getItem('kanban-state')
            if (localData) {
              try {
                const parsed = JSON.parse(localData)
            const { state: migratedState, migrated: wasMigrated } = ensureWorkspaceState(parsed)

            console.log('Migrating data from localStorage to Supabase...')
            const insertPayload: UserDataInsert = {
              user_id: user.id,
              app_state: migratedState as unknown as UserDataInsert['app_state'],
              workspace_state: migratedState as unknown as UserDataInsert['workspace_state'],
              schema_version: 2,
            }
            const { error: insertError } = await supabase
              .from('user_data')
              .insert(insertPayload)

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
            const insertPayload: UserDataInsert = {
              user_id: user.id,
              app_state: initialState as unknown as UserDataInsert['app_state'],
              workspace_state: initialState as unknown as UserDataInsert['workspace_state'],
              schema_version: 2,
            }
            const { error: insertError } = await supabase
              .from('user_data')
              .insert(insertPayload)

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
          const record = data as {
            workspace_state?: WorkspaceState | null
            app_state?: WorkspaceState | null
            schema_version?: number | null
          }
          const currentVersion = record.schema_version ?? 1

          let loadedState: WorkspaceState
          let wasMigrated = currentVersion >= 2

          if (record.workspace_state) {
            const { state } = ensureWorkspaceState(record.workspace_state)
            loadedState = state
          } else if (record.app_state) {
            console.log('Migrating AppState to WorkspaceState...')
            const result = ensureWorkspaceState(record.app_state)
            loadedState = result.state
            wasMigrated = true

            // Auto-fix common issues after migration
            console.log('Running auto-fix on migrated state...')
            const analysis = analyzeWorkspaceState(loadedState)
            if (analysis.warnings.length > 0 || analysis.errors.length > 0) {
              console.warn('Issues found in migrated state:', analysis)
              const { fixed, report } = autoFixWorkspaceState(loadedState)
              if (report.fixes.length > 0) {
                console.log('Auto-fixes applied:', report.fixes)
                loadedState = fixed
              }
            } else {
              console.log('Migrated state is valid, no fixes needed')
            }

            try {
              await supabase
                .from('user_data')
                .update({
                  workspace_state: loadedState,
                  app_state: loadedState,
                  schema_version: 2,
                  state_backup: record.app_state,
                  migrated_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
              console.log('Migration complete - workspace_state column populated')
            } catch (err) {
              console.warn('Could not update database during migration:', err)
            }
          } else {
            loadedState = defaultWorkspaceState()
          }

          setState(loadedState)
          currentStateRef.current = loadedState
          setMigrated(wasMigrated)
          localStorage.removeItem('kanban-state')
          console.log('Data loaded and migrated successfully!')
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
        const updatePayload: UserDataUpdate = {
          workspace_state: dataToSave as unknown as UserDataUpdate['workspace_state'],
          app_state: dataToSave as unknown as UserDataUpdate['app_state'], // keep legacy column in sync for recovery tooling
          schema_version: 2,
          updated_at: new Date().toISOString(),
        }
        const { error } = await supabase
          .from('user_data')
          .update(updatePayload)
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
            workspaceState: currentStateRef.current,
            appState: currentStateRef.current,
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

        // Add to history if not from undo/redo
        if (!isUndoRedoRef.current) {
          // Remove any future history if we're in the middle of the history stack
          if (historyIndexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
          }
          // Add new state to history
          historyRef.current.push(newState)
          historyIndexRef.current = historyRef.current.length - 1

          // Limit history to 50 states to prevent memory issues
          if (historyRef.current.length > 50) {
            historyRef.current = historyRef.current.slice(-50)
            historyIndexRef.current = historyRef.current.length - 1
          }
        }
        isUndoRedoRef.current = false

        // Trigger debounced save
        triggerDebouncedSave()
        return newState
      })
    },
    [triggerDebouncedSave]
  )

  // Undo function
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      isUndoRedoRef.current = true
      historyIndexRef.current -= 1
      const previousState = historyRef.current[historyIndexRef.current]
      setState(previousState)
      currentStateRef.current = previousState
      triggerDebouncedSave()
    }
  }, [triggerDebouncedSave])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true
      historyIndexRef.current += 1
      const nextState = historyRef.current[historyIndexRef.current]
      setState(nextState)
      currentStateRef.current = nextState
      triggerDebouncedSave()
    }
  }, [triggerDebouncedSave])

  // Manual save function
  const saveNow = useCallback(() => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    // Trigger immediate save
    saveToSupabase()
  }, [saveToSupabase])

  // Initialize history when state is first loaded
  useEffect(() => {
    if (!loading && historyRef.current.length === 0) {
      historyRef.current = [state]
      historyIndexRef.current = 0
    }
  }, [loading, state])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  return [
    state,
    setStateAndSync,
    loading,
    { syncing, error: syncError, lastSynced, migrated },
    { undo, redo, canUndo, canRedo, saveNow }
  ]
}
