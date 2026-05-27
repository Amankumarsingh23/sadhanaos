// Auto-generate the full version with: npx supabase gen types typescript --project-id <id>
// This stub keeps TypeScript happy until you wire up the Supabase CLI.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          age: number | null
          gender: string | null
          sadhana_start_date: string | null
          target_days: number
          ist_deity: string | null
          prayer_schedule: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          sadhana_start_date?: string | null
          target_days?: number
          ist_deity?: string | null
          prayer_schedule?: Json
        }
        Update: {
          id?: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          sadhana_start_date?: string | null
          target_days?: number
          ist_deity?: string | null
          prayer_schedule?: Json
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          streak_maintained: boolean
          meditation_minutes: number
          pranayama_done: boolean
          pranayama_type: string | null
          prayers_completed: Json
          skincare_morning: boolean
          skincare_evening: boolean
          water_glasses: number
          sleep_hours: number | null
          exercise_done: boolean
          gratitude_1: string | null
          gratitude_2: string | null
          gratitude_3: string | null
          mood_score: number | null
          energy_score: number | null
          clarity_score: number | null
          confidence_score: number | null
          journal_entry: string | null
          daily_intention: string | null
          shloka_learned_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          log_date: string
          streak_maintained?: boolean
          meditation_minutes?: number
          pranayama_done?: boolean
          pranayama_type?: string | null
          prayers_completed?: Json
          skincare_morning?: boolean
          skincare_evening?: boolean
          water_glasses?: number
          sleep_hours?: number | null
          exercise_done?: boolean
          gratitude_1?: string | null
          gratitude_2?: string | null
          gratitude_3?: string | null
          mood_score?: number | null
          energy_score?: number | null
          clarity_score?: number | null
          confidence_score?: number | null
          journal_entry?: string | null
          daily_intention?: string | null
          shloka_learned_id?: string | null
          notes?: string | null
        }
        Update: {
          user_id?: string
          log_date?: string
          streak_maintained?: boolean
          meditation_minutes?: number
          pranayama_done?: boolean
          pranayama_type?: string | null
          prayers_completed?: Json
          skincare_morning?: boolean
          skincare_evening?: boolean
          water_glasses?: number
          sleep_hours?: number | null
          exercise_done?: boolean
          gratitude_1?: string | null
          gratitude_2?: string | null
          gratitude_3?: string | null
          mood_score?: number | null
          energy_score?: number | null
          clarity_score?: number | null
          confidence_score?: number | null
          journal_entry?: string | null
          daily_intention?: string | null
          shloka_learned_id?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      urge_logs: {
        Row: {
          id: string
          user_id: string
          logged_at: string
          intensity: number
          trigger_tags: string[]
          trigger_notes: string | null
          action_taken: string
          held_strong: boolean
          breathing_done: boolean
        }
        Insert: {
          user_id: string
          logged_at?: string
          intensity: number
          trigger_tags?: string[]
          trigger_notes?: string | null
          action_taken: string
          held_strong?: boolean
          breathing_done?: boolean
        }
        Update: {
          user_id?: string
          logged_at?: string
          intensity?: number
          trigger_tags?: string[]
          trigger_notes?: string | null
          action_taken?: string
          held_strong?: boolean
          breathing_done?: boolean
        }
        Relationships: []
      }
      weekly_reflections: {
        Row: {
          id: string
          user_id: string
          week_number: number
          week_start_date: string
          mental_clarity: number | null
          emotional_stability: number | null
          spiritual_connection: number | null
          physical_energy: number | null
          skin_quality: number | null
          sleep_quality: number | null
          social_confidence: number | null
          eye_contact: number | null
          biggest_challenge: string
          biggest_win: string
          what_i_learned: string
          free_reflection: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          week_number: number
          week_start_date: string
          mental_clarity?: number | null
          emotional_stability?: number | null
          spiritual_connection?: number | null
          physical_energy?: number | null
          skin_quality?: number | null
          sleep_quality?: number | null
          social_confidence?: number | null
          eye_contact?: number | null
          biggest_challenge?: string
          biggest_win?: string
          what_i_learned?: string
          free_reflection?: string | null
        }
        Update: {
          user_id?: string
          week_number?: number
          week_start_date?: string
          mental_clarity?: number | null
          emotional_stability?: number | null
          spiritual_connection?: number | null
          physical_energy?: number | null
          skin_quality?: number | null
          sleep_quality?: number | null
          social_confidence?: number | null
          eye_contact?: number | null
          biggest_challenge?: string
          biggest_win?: string
          what_i_learned?: string
          free_reflection?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          id: string
          user_id: string
          day_number: number
          title: string
          description: string
          achieved: boolean
          achieved_at: string | null
          reflection: string | null
        }
        Insert: {
          user_id: string
          day_number: number
          title: string
          description: string
          achieved?: boolean
          achieved_at?: string | null
          reflection?: string | null
        }
        Update: {
          user_id?: string
          day_number?: number
          title?: string
          description?: string
          achieved?: boolean
          achieved_at?: string | null
          reflection?: string | null
        }
        Relationships: []
      }
      scripture_progress: {
        Row: {
          id: string
          user_id: string
          scripture_name: string
          chapter: number
          verse: number
          completed: boolean
          notes: string | null
          completed_at: string | null
          bookmarked: boolean
        }
        Insert: {
          user_id: string
          scripture_name: string
          chapter: number
          verse: number
          completed?: boolean
          notes?: string | null
          completed_at?: string | null
          bookmarked?: boolean
        }
        Update: {
          user_id?: string
          scripture_name?: string
          chapter?: number
          verse?: number
          completed?: boolean
          notes?: string | null
          completed_at?: string | null
          bookmarked?: boolean
        }
        Relationships: []
      }
      ai_reports: {
        Row: {
          id: string
          user_id: string
          report_type: 'weekly' | 'monthly' | 'guidance'
          content: string
          data_snapshot: Json
          created_at: string
        }
        Insert: {
          user_id: string
          report_type: 'weekly' | 'monthly' | 'guidance'
          content: string
          data_snapshot?: Json
        }
        Update: {
          user_id?: string
          report_type?: 'weekly' | 'monthly' | 'guidance'
          content?: string
          data_snapshot?: Json
        }
        Relationships: []
      }
      affirmations: {
        Row: {
          id: string
          user_id: string
          text_hindi: string | null
          text_english: string
          source: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          text_hindi?: string | null
          text_english: string
          source?: string | null
          active?: boolean
        }
        Update: {
          user_id?: string
          text_hindi?: string | null
          text_english?: string
          source?: string | null
          active?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      v_current_streak: {
        Row: {
          user_id: string
          total_days_maintained: number
          current_streak: number
        }
        Relationships: []
      }
    }
    Functions: {
      seed_milestones:   { Args: { p_user_id: string }; Returns: undefined }
      seed_affirmations: { Args: { p_user_id: string }; Returns: undefined }
    }
  }
}
