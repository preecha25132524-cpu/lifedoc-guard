import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatThaiDate } from '@/lib/utils'

interface DatePickerProps {
  id?: string
  value: string | null
  onChange: (isoDate: string | null) => void
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}

const WEEKDAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseIso(value: string | null) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m: m - 1, d }
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  clearable = false,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const parsed = parseIso(value)
  const today = new Date()
  const [viewYear, setViewYear] = React.useState(parsed?.y ?? today.getFullYear())
  const [viewMonth, setViewMonth] = React.useState(parsed?.m ?? today.getMonth())

  React.useEffect(() => {
    if (open) {
      const p = parseIso(value)
      setViewYear(p?.y ?? today.getFullYear())
      setViewMonth(p?.m ?? today.getMonth())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const cells: { day: number; inMonth: boolean; iso: string; y: number; m: number }[] = []
  for (let i = 0; i < startWeekday; i++) {
    const d = daysInPrevMonth - startWeekday + 1 + i
    const m = viewMonth === 0 ? 11 : viewMonth - 1
    const y = viewMonth === 0 ? viewYear - 1 : viewYear
    cells.push({ day: d, inMonth: false, iso: toIso(y, m, d), y, m })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, iso: toIso(viewYear, viewMonth, d), y: viewYear, m: viewMonth })
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1]
    const nextDay = last.inMonth || last.m !== viewMonth ? last.day + 1 : 1
    const m = viewMonth === 11 ? 0 : viewMonth + 1
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    const isFirstOverflowRow = last.inMonth
    const day = isFirstOverflowRow ? 1 : nextDay
    cells.push({ day, inMonth: false, iso: toIso(y, m, day), y, m })
    if (cells.length >= 42) break
  }

  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate())
  const years = Array.from({ length: 121 }, (_, i) => today.getFullYear() + 30 - i)

  function goMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background/60 px-3 text-left text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{value ? formatThaiDate(value) : placeholder}</span>
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="ล้างวันที่"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <Select value={String(viewMonth)} onValueChange={(v) => setViewMonth(Number(v))}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {MONTHS_TH.map((m, i) => (
                <SelectItem key={m} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(viewYear)} onValueChange={(v) => setViewYear(Number(v))}>
            <SelectTrigger className="h-8 w-[5.5rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y + 543}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => goMonth(1)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS_TH.map((w) => (
            <div key={w} className="text-[11px] font-medium text-muted-foreground">
              {w}
            </div>
          ))}
          {cells.map((c, i) => {
            const isSelected = value === c.iso
            const isToday = todayIso === c.iso
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(c.iso)
                  setOpen(false)
                }}
                className={cn(
                  'mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors',
                  !c.inMonth && 'text-muted-foreground/40',
                  c.inMonth && !isSelected && 'hover:bg-accent',
                  isSelected && 'bg-primary text-primary-foreground font-semibold',
                  !isSelected && isToday && 'ring-1 ring-primary/60',
                )}
              >
                {c.day}
              </button>
            )
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
          <button
            type="button"
            onClick={() => {
              onChange(todayIso)
              setOpen(false)
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            วันนี้
          </button>
          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className="text-xs text-muted-foreground hover:text-critical"
            >
              ล้างค่า
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
