import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ComputedDoc, DocumentDraft, DocumentItem, DocumentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function genId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Days remaining until expiry. Negative means already expired. */
export function daysRemaining(expiryDate: string, from: Date = new Date()) {
  const today = startOfDay(from)
  const expiry = startOfDay(new Date(expiryDate))
  return Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY)
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Percentage of the document's lifespan that has elapsed (0-100). */
export function progressPercent(
  issueDate: string | null,
  expiryDate: string,
  from: Date = new Date(),
) {
  if (!issueDate) {
    // Without an issue date, approximate using a 1-year lookback window.
    const expiry = startOfDay(new Date(expiryDate))
    const approxIssue = new Date(expiry)
    approxIssue.setFullYear(approxIssue.getFullYear() - 1)
    return clampPct(computePct(approxIssue, expiry, from))
  }
  const issue = startOfDay(new Date(issueDate))
  const expiry = startOfDay(new Date(expiryDate))
  return clampPct(computePct(issue, expiry, from))
}

function computePct(issue: Date, expiry: Date, from: Date) {
  const total = expiry.getTime() - issue.getTime()
  if (total <= 0) return 100
  const elapsed = startOfDay(from).getTime() - issue.getTime()
  return (elapsed / total) * 100
}

function clampPct(pct: number) {
  return Math.min(100, Math.max(0, pct))
}

export function computeStatus(remaining: number): DocumentStatus {
  if (remaining < 0) return 'critical'
  if (remaining <= 15) return 'critical'
  if (remaining <= 30) return 'urgent'
  if (remaining <= 90) return 'expiring'
  return 'active'
}

export function withComputed(doc: DocumentItem, from: Date = new Date()): ComputedDoc {
  const remaining = daysRemaining(doc.expiryDate, from)
  return {
    ...doc,
    daysRemaining: remaining,
    progressPct: progressPercent(doc.issueDate, doc.expiryDate, from),
    status: computeStatus(remaining),
  }
}

export function formatThaiDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  const thaiYear = d.getFullYear() + 543
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${thaiYear}`
}

export function formatDaysRemaining(days: number) {
  if (days < 0) return `เกินกำหนด ${Math.abs(days)} วัน`
  if (days === 0) return 'หมดอายุวันนี้'
  return `เหลืออีก ${days} วัน`
}

/** Masks a document/policy number, keeping only the last N characters visible. */
export function maskValue(value: string | undefined, visibleTail = 3) {
  if (!value) return '—'
  const stripped = value.trim()
  if (stripped.length <= visibleTail) return '•'.repeat(stripped.length)
  const segments = stripped.split(/(-)/) // preserve dashes as separators
  let remainingVisible = visibleTail
  const out: string[] = []
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i]
    if (seg === '-') {
      out.unshift(seg)
      continue
    }
    if (remainingVisible >= seg.length) {
      out.unshift(seg)
      remainingVisible -= seg.length
    } else if (remainingVisible > 0) {
      out.unshift('•'.repeat(seg.length - remainingVisible) + seg.slice(seg.length - remainingVisible))
      remainingVisible = 0
    } else {
      out.unshift('•'.repeat(seg.length))
    }
  }
  return out.join('')
}

/** Strips the computed-only fields off a ComputedDoc, leaving an editable draft. */
export function toDraft(doc: ComputedDoc): DocumentDraft {
  const { id, createdAt, updatedAt, daysRemaining, progressPct, status, ...rest } = doc
  void id
  void createdAt
  void updatedAt
  void daysRemaining
  void progressPct
  void status
  return rest
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
