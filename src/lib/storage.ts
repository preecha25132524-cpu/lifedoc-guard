import type { DocumentItem } from '@/types'

const STORAGE_KEY = 'lifedoc-guard:documents:v1'
const THEME_KEY = 'lifedoc-guard:theme'
const LAST_SYNCED_UID_KEY = 'lifedoc-guard:last-synced-uid'

/**
 * Demo/placeholder documents used to be id-prefixed `mock-` and auto-seeded
 * on first run. Seeding is now off — every new device/account starts truly
 * blank so a new sign-up only ever sees documents they added themselves.
 * `isDemoDocument` is kept so cloud sync still recognizes and discards any
 * leftover `mock-` rows from devices that were seeded before this change.
 */
export function isDemoDocument(doc: DocumentItem): boolean {
  return doc.id.startsWith('mock-')
}

export function loadDocuments(): DocumentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((d) => !isDemoDocument(d)) as DocumentItem[]
    }
    return []
  } catch {
    return []
  }
}

export function saveDocuments(docs: DocumentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch (err) {
    console.error('ไม่สามารถบันทึกข้อมูลลง localStorage ได้', err)
  }
}

/** Wipes the local document cache outright (no seeding/reload involved). */
export function clearDocuments() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Tracks which Supabase account's data this device's local cache currently
 * reflects. Used to detect "a different account just signed in on this same
 * device/browser" so leftover local documents from a previous account never
 * get merged/pushed into the new one — see useDocuments' cloud-sync effect.
 */
export function getLastSyncedUserId(): string | null {
  try {
    return localStorage.getItem(LAST_SYNCED_UID_KEY)
  } catch {
    return null
  }
}

export function setLastSyncedUserId(userId: string | null) {
  try {
    if (userId) localStorage.setItem(LAST_SYNCED_UID_KEY, userId)
    else localStorage.removeItem(LAST_SYNCED_UID_KEY)
  } catch {
    /* ignore */
  }
}

export type ThemeMode = 'dark' | 'light'

export function loadTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'dark' || raw === 'light') return raw
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function saveTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* ignore */
  }
}

export interface BackupFile {
  app: 'lifedoc-guard'
  version: 1
  exportedAt: string
  documents: DocumentItem[]
}

export function buildBackup(docs: DocumentItem[]): BackupFile {
  return {
    app: 'lifedoc-guard',
    version: 1,
    exportedAt: new Date().toISOString(),
    documents: docs,
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  triggerDownload(blob, filename)
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  ok: boolean
  count?: number
  error?: string
}

/** Parses & lightly validates an imported backup JSON before merging it in. */
export function parseBackup(text: string): ImportResult & { documents?: DocumentItem[] } {
  try {
    const data = JSON.parse(text)
    const documents: unknown = Array.isArray(data) ? data : data?.documents
    if (!Array.isArray(documents)) {
      return { ok: false, error: 'ไฟล์ไม่ถูกต้อง: ไม่พบรายการเอกสาร (documents)' }
    }
    const valid = documents.every(
      (d) =>
        d &&
        typeof d === 'object' &&
        typeof (d as DocumentItem).title === 'string' &&
        typeof (d as DocumentItem).expiryDate === 'string',
    )
    if (!valid) {
      return { ok: false, error: 'ไฟล์ไม่ถูกต้อง: โครงสร้างข้อมูลเอกสารไม่สมบูรณ์' }
    }
    return { ok: true, count: documents.length, documents: documents as DocumentItem[] }
  } catch {
    return { ok: false, error: 'ไม่สามารถอ่านไฟล์ JSON นี้ได้' }
  }
}
