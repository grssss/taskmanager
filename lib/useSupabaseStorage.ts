'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { AppState } from './types'

export function useSupabaseStorage<T extends AppState>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { user } = useAuth()
  const [state, setState] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)

  // Load data from Supabase when user logs in
  useEffect(() => {
    isMountedRef.current = true

    async function loadData() {
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
                  })

                if (!insertError && isMountedRef.current) {
                  setState(parsed as T)
                  console.log('Data migrated successfully!')
                }
              } catch (e) {
                console.error('Failed to migrate localStorage data:', e)
              }
            } else {
              // No local data either, insert initial value
              const { error: insertError } = await supabase
                .from('user_data')
                .insert({
                  user_id: user.id,
                  app_state: initialValue,
                })

              if (!insertError && isMountedRef.current) {
                setState(initialValue)
              }
            }
          } else {
            console.error('Error loading data from Supabase:', error)
          }
        } else if (data && isMountedRef.current) {
          setState(data.app_state as T)
        }
      } catch (err) {
        console.error('Unexpected error loading data:', err)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMountedRef.current = false
    }
  }, [user, key, initialValue])

  // Save data to Supabase (debounced)
  const saveToSupabase = useCallback(
    async (newState: T) => {
      if (!user) return

      try {
        const { error } = await supabase
          .from('user_data')
          .update({
            app_state: newState,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('Error saving to Supabase:', error)
        }
      } catch (err) {
        console.error('Unexpected error saving data:', err)
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

  return [state, setStateAndSync, loading]
}
