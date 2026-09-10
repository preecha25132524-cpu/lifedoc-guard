import { useCallback, useEffect, useState } from 'react'
import type { ComputedDoc } from '@/types'
import {
  checkAndNotify,
  getNotificationPermission,
  isNotificationSupported,
  loadNotificationsEnabled,
  requestNotificationPermission,
  saveNotificationsEnabled,
  sendConfirmationNotification,
} from '@/lib/notifications'

/**
 * Wires up in-device (browser/OS) expiry notifications — no email, no backend.
 * The user opts in explicitly (a click is required to request permission);
 * once granted + enabled, documents are checked against their reminder
 * threshold whenever the list changes (and hourly, via useDocuments' own
 * recompute tick) and a notification fires at most once per document per day.
 */
export function useNotifications(documents: ComputedDoc[]) {
  const supported = isNotificationSupported()
  const [enabled, setEnabled] = useState(() => loadNotificationsEnabled())
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission(),
  )

  useEffect(() => {
    if (!supported || !enabled || permission !== 'granted') return
    checkAndNotify(documents)
  }, [documents, enabled, permission, supported])

  const enable = useCallback(async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      setEnabled(true)
      saveNotificationsEnabled(true)
      sendConfirmationNotification()
    }
    return result
  }, [])

  const disable = useCallback(() => {
    setEnabled(false)
    saveNotificationsEnabled(false)
  }, [])

  return { supported, enabled, permission, enable, disable }
}
