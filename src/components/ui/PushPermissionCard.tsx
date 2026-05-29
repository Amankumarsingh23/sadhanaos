'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellOff, Check, X } from 'lucide-react'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type Status = 'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported'

export function PushPermissionCard() {
  const [status,    setStatus]    = useState<Status>('idle')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    if (Notification.permission === 'granted') setStatus('subscribed')
    if (Notification.permission === 'denied')  setStatus('denied')
    // Don't auto-ask — wait for user to click
  }, [])

  const handleEnable = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return
    setStatus('subscribing')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      })

      setStatus('subscribed')
    } catch (err) {
      console.error('[push]', err)
      setStatus('idle')
    }
  }

  const handleDisable = async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setStatus('idle')
  }

  if (dismissed || status === 'unsupported') return null

  return (
    <div className="rounded-card border border-sandstone bg-parchment p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sacred-saffron/12 border border-sacred-saffron/30 flex items-center justify-center shrink-0">
            <Bell size={16} className="text-sacred-saffron" />
          </div>
          <div>
            <p className="font-semibold text-indigo-deep text-sm">Practice Reminders</p>
            <p className="text-xs text-twilight">Brahma muhurta mornings · Evening streak alerts · Milestones</p>
          </div>
        </div>
        {status !== 'subscribed' && (
          <button onClick={() => setDismissed(true)} className="text-twilight/40 hover:text-twilight mt-0.5 shrink-0">
            <X size={15} />
          </button>
        )}
      </div>

      {status === 'subscribed' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sage-green text-sm">
            <Check size={16} />
            <span>Notifications enabled</span>
          </div>
          <button
            onClick={handleDisable}
            className="flex items-center gap-1.5 text-xs text-twilight hover:text-rose-red transition-colors"
          >
            <BellOff size={13} /> Disable
          </button>
        </motion.div>
      ) : status === 'denied' ? (
        <div className="text-xs text-twilight bg-sandstone/30 rounded-lg px-3 py-2.5">
          Notifications are blocked in your browser settings. To enable:
          tap the 🔒 icon in your browser address bar → Notifications → Allow.
        </div>
      ) : (
        <button
          onClick={handleEnable}
          disabled={status === 'subscribing'}
          className="w-full py-2.5 rounded-xl bg-sacred-saffron text-dawn-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          <Bell size={14} />
          {status === 'subscribing' ? 'Enabling…' : 'Enable Practice Reminders'}
        </button>
      )}

      <p className="text-[11px] text-twilight/50 text-center">
        Morning at 5:30am · Evening at 9pm · Streak milestones
      </p>
    </div>
  )
}
