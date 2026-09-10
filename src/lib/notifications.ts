import type { ComputedDoc } from '@/types'

const ENABLED_KEY = 'lifedoc-guard:notifications-enabled'
const LOG_KEY = 'lifedoc-guard:notified-log:v1'

/** Whether this browser exposes the Notification API at all. */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export function loadNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

export function saveNotificationsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** docId -> last date (YYYY-MM-DD) a "due" notification was already sent for it. */
type NotifiedLog = Record<string, string>

function loadLog(): NotifiedLog {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (raw) return JSON.parse(raw) as NotifiedLog
  } catch {
    /* ignore */
  }
  return {}
}

function saveLog(log: NotifiedLog) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log))
  } catch {
    /* ignore */
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

async function showNotification(title: string, options: NotificationOptions) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  try {
    // Prefer the service-worker route (works for installed/PWA + background),
    // fall back to a plain Notification (works while the tab/dev-server is open).
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, options)
        return
      }
    }
    new Notification(title, options)
  } catch {
    /* some browsers (e.g. iOS Safari outside an installed PWA) don't support this at all */
  }
}

/** One-off confirmation shown right after the user turns notifications on. */
export function sendConfirmationNotification() {
  void showNotification('LifeDoc Guard', {
    body: 'เปิดการแจ้งเตือนเรียบร้อย จะแจ้งเตือนเมื่อมีเอกสารใกล้หรือถึงกำหนดหมดอายุ',
    tag: 'lifedoc-confirm',
    icon: '/pwa-192.png',
  })
}

/**
 * Checks documents against their reminder threshold and fires a browser/OS
 * notification for any that are due and haven't already been notified today.
 * Cheap and idempotent — safe to call on every re-render / interval tick.
 */
export function checkAndNotify(docs: ComputedDoc[]) {
  if (!loadNotificationsEnabled() || getNotificationPermission() !== 'granted') return

  const log = loadLog()
  const today = todayKey()
  let changed = false

  for (const doc of docs) {
    const isDue = doc.daysRemaining <= doc.reminderDays
    if (!isDue) continue
    if (log[doc.id] === today) continue // already notified for this doc today

    const body =
      doc.daysRemaining < 0
        ? `${doc.title} หมดอายุแล้ว ${Math.abs(doc.daysRemaining)} วัน`
        : doc.daysRemaining === 0
          ? `${doc.title} หมดอายุวันนี้`
          : `${doc.title} เหลืออีก ${doc.daysRemaining} วันก่อนหมดอายุ`

    void showNotification('LifeDoc Guard — แจ้งเตือนเอกสาร', {
      body,
      tag: `lifedoc-${doc.id}`,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
    })

    log[doc.id] = today
    changed = true
  }

  if (changed) saveLog(log)
}
