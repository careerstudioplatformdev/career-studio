// Generated from the Supabase schema. Regenerate after every migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: number
          resume_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: never
          resume_id?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: never
          resume_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          consent_version: string | null
          consented_at: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          consent_version?: string | null
          consented_at?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          consent_version?: string | null
          consented_at?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          content: Json
          created_at: string
          id: string
          reason: string
          resume_id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          reason?: string
          resume_id: string
          user_id?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          reason?: string
          resume_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          approved_at: string | null
          content: Json
          created_at: string
          id: string
          origin: string
          qa_state: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          content?: Json
          created_at?: string
          id?: string
          origin: string
          qa_state?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          approved_at?: string | null
          content?: Json
          created_at?: string
          id?: string
          origin?: string
          qa_state?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
