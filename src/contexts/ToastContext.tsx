'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { Toaster } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id:          string
  message:     string
  type:        ToastType
  description?: string
}

interface ToastContextValue {
  toast: (message: string, opts?: { type?: ToastType; description?: string; duration?: number }) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback(
    (message: string, opts?: { type?: ToastType; description?: string }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [
        ...prev.slice(-4), // max 5 at once
        { id, message, type: opts?.type ?? 'info', description: opts?.description },
      ])
    },
    []
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Graceful fallback — don't break if used outside provider
    return {
      toast: (msg, opts) => console.info(`[Toast ${opts?.type ?? 'info'}]: ${msg}`),
    }
  }
  return ctx
}
