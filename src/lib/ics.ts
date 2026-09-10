import type { DocumentItem } from '@/types'
import { CATEGORIES } from '@/types'
import { triggerDownload } from '@/lib/storage'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Formats a YYYY-MM-DD date string as an all-day ICS DATE value (YYYYMMDD). */
function toIcsDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function toIcsStamp(d: Date) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

function escapeIcsText(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(line: string) {
  // RFC5545 requires folding lines longer than 75 octets; keep it simple/safe.
  if (line.length <= 74) return line
  const chunks: string[] = []
  let rest = line
  while (rest.length > 74) {
    chunks.push(rest.slice(0, 74))
    rest = ' ' + rest.slice(74)
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}

/** Builds a downloadable .ics calendar with one all-day VALARM'd event per document expiry. */
export function exportDocumentsToIcs(docs: DocumentItem[], filename = 'lifedoc-guard-expiry.ics') {
  const now = new Date()
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LifeDoc Guard//TH//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:LifeDoc Guard - วันหมดอายุเอกสาร',
  ]

  for (const doc of docs) {
    const dtstart = toIcsDate(doc.expiryDate)
    const nextDay = new Date(doc.expiryDate)
    nextDay.setDate(nextDay.getDate() + 1)
    const dtend = `${nextDay.getFullYear()}${pad(nextDay.getMonth() + 1)}${pad(nextDay.getDate())}`
    const categoryLabel = CATEGORIES[doc.category]?.label ?? doc.category
    const summary = `หมดอายุ: ${doc.title}`
    const descriptionParts = [
      `หมวดหมู่: ${categoryLabel}`,
      doc.issuer ? `หน่วยงาน/ผู้ออก: ${doc.issuer}` : '',
      doc.renewalMethod ? `วิธีต่ออายุ: ${doc.renewalMethod}` : '',
      doc.renewalUrl ? `ลิงก์: ${doc.renewalUrl}` : '',
      doc.notes ? `หมายเหตุ: ${doc.notes}` : '',
    ].filter(Boolean)

    lines.push(
      'BEGIN:VEVENT',
      `UID:${doc.id}@lifedoc-guard`,
      `DTSTAMP:${toIcsStamp(now)}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      foldLine(`SUMMARY:${escapeIcsText(summary)}`),
      foldLine(`DESCRIPTION:${escapeIcsText(descriptionParts.join('\\n'))}`),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(summary)}`,
      `TRIGGER:-P${doc.reminderDays}D`,
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  const blob = new Blob([lines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8',
  })
  triggerDownload(blob, filename)
}
