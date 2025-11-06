'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { AppState } from './types'

export function useSupabaseStorage<T extends AppState>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean, { syncing: boolean; error: string | null; lastSynced: Date | null }] {
  const { user } = useAuth()
  const [state, setState] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)

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
          .select('app_state')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase error details:', {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })

          if (error.code === 'PGRST116') {
            // No data found, check localStorage for migration
            const localData = localStorage.getItem(key)
            if (localData) {
              try {
                const parsed = JSON.parse(localData)
                // Migrate data from localStorage to Supabase
                console.log('Migrating data from localStorage to Supabase...')
                const { error: insertError } = await supabase
                  .from('user_data')
                  .insert({
                    user_id: user.id,
                    app_state: parsed,
                  } as any)

                if (insertError) {
                  console.error('Failed to insert data:', insertError)
                } else if (isMountedRef.current) {
                  setState(parsed as T)
                  // Clear localStorage after successful migration
                  localStorage.removeItem(key)
                  console.log('Data migrated successfully and localStorage cleared!')
                }
              } catch (e) {
                console.error('Failed to migrate localStorage data:', e)
              }
            } else {
              // No local data either, insert initial value
              console.log('Creating new user data record...')
              const { error: insertError } = await supabase
                .from('user_data')
                .insert({
                  user_id: user.id,
                  app_state: initialValue,
                } as any)

              if (insertError) {
                console.error('Failed to create initial data:', insertError)
              } else if (isMountedRef.current) {
                setState(initialValue)
              }
            }
          } else {
            console.error('Error loading data from Supabase:', error)
          }
        } else if (data && isMountedRef.current) {
          // Successfully loaded from Supabase - clear any old localStorage data
          setState((data as any).app_state as T)
          localStorage.removeItem(key)
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
  }, [user, key])

  // Save data to Supabase (debounced)
  const saveToSupabase = useCallback(
    async (newState: T) => {
      if (!user) return

      setSyncing(true)
      setSyncError(null)

      try {
        const { error } = await (supabase as any)
          .from('user_data')
          .update({
            app_state: newState,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error saving to Supabase:', error)
          setSyncError(error.message || 'Failed to sync data')
        } else {
          setLastSynced(new Date())
          setSyncError(null)
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

  // Custom setState that also syncs to Supabase
  const setStateAndSync = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newState = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value

        // Debounce the save to avoid too many API calls
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
          saveToSupabase(newState)
        }, 500) // Save after 500ms of inactivity

        return newState
      })
    },
    [saveToSupabase]
  )

  return [state, setStateAndSync, loading, { syncing, error: syncError, lastSynced }]
}
