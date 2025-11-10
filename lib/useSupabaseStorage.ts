'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { AppState } from './types'
import type { Database } from './database.types'

type UserDataInsert = Database['public']['Tables']['user_data']['Insert']
type UserDataUpdate = Database['public']['Tables']['user_data']['Update']

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
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const currentStateRef = useRef<T>(initialValue)
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
                const insertPayload: UserDataInsert = {
                  user_id: user.id,
                  app_state: parsed as unknown as Database['public']['Tables']['user_data']['Insert']['app_state'],
                }
                const { error: insertError } = await supabase
                  .from('user_data')
                  .insert(insertPayload)

                if (insertError) {
                  console.error('Failed to insert data:', insertError)
                } else if (isMountedRef.current) {
                  const migratedData = parsed as T
                  setState(migratedData)
                  currentStateRef.current = migratedData
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
              const insertPayload: UserDataInsert = {
                user_id: user.id,
                app_state: initialValue as unknown as Database['public']['Tables']['user_data']['Insert']['app_state'],
              }
              const { error: insertError } = await supabase
                .from('user_data')
                .insert(insertPayload)

              if (insertError) {
                console.error('Failed to create initial data:', insertError)
              } else if (isMountedRef.current) {
                setState(initialValue)
                currentStateRef.current = initialValue
              }
            }
          } else {
            console.error('Error loading data from Supabase:', error)
          }
        } else if (data && isMountedRef.current) {
          // Successfully loaded from Supabase - clear any old localStorage data
          const loadedData = (data?.app_state as T) ?? initialValue
          setState(loadedData)
          currentStateRef.current = loadedData
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
  }, [user, key, initialValue])

  // Save data to Supabase
  const saveToSupabase = useCallback(
    async (stateToSave?: T) => {
      if (!user) return

      const dataToSave = stateToSave || currentStateRef.current
      setSyncing(true)
      setSyncError(null)

      try {
        const updatePayload: UserDataUpdate = {
          app_state: dataToSave as unknown as Database['public']['Tables']['user_data']['Update']['app_state'],
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
          console.log('Data saved to Supabase successfully')
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
        // This ensures the request completes even after the page closes
        try {
          const blob = new Blob([JSON.stringify({
            userId: user.id,
            appState: currentStateRef.current
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
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newState = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        // Update ref for saves
        currentStateRef.current = newState
        // Trigger debounced save
        triggerDebouncedSave()
        return newState
      })
    },
    [triggerDebouncedSave]
  )

  return [state, setStateAndSync, loading, { syncing, error: syncError, lastSynced }]
}
