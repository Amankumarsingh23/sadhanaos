export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface SadhanaEntry {
  id: string
  user_id: string
  date: string
  practice: string
  duration_minutes: number
  notes?: string
  mood?: number
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  date: string
  title?: string
  content: string
  tags?: string[]
  created_at: string
}

export interface MantraSession {
  id: string
  user_id: string
  mantra: string
  count: number
  date: string
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}
