export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_data: {
        Row: {
          id: string
          user_id: string
          app_state: Json
          workspace_state: Json | null
          schema_version: number | null
          state_backup: Json | null
          migrated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          app_state: Json
          workspace_state?: Json | null
          schema_version?: number | null
          state_backup?: Json | null
          migrated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          app_state?: Json
          workspace_state?: Json | null
          schema_version?: number | null
          state_backup?: Json | null
          migrated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
