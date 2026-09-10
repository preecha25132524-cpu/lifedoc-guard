import { useState } from 'react'
import {
  Bell,
  Eye,
  EyeOff,
  ExternalLink,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { resolveIcon } from '@/lib/icon-map'
import { cn, formatDaysRemaining, formatThaiDate, maskValue } from '@/lib/utils'
import { CATEGORIES, type ComputedDoc, type ReminderDays } from '@/types'

interface DocumentCardProps {
  doc: ComputedDoc
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onSetReminder: (days: ReminderDays) => void
}

const REMINDER_CHOICES: ReminderDays[] = [90, 60, 30, 15, 7]

const STATUS_COLOR: Record<ComputedDoc['status'], string> = {
  active: 'text-success',
  expiring: 'text-warning',
  urgent: 'text-orange-400',
  critical: 'text-critical',
}

const STATUS_LABEL: Record<ComputedDoc['status'], string> = {
  active: 'ปกติ',
  expiring: 'ใกล้หมดอายุ',
  urgent: 'ด่วน',
  critical: 'หมดอายุ/วิกฤต',
}

const PROGRESS_COLOR: Record<ComputedDoc['status'], string> = {
  active: 'bg-success',
  expiring: 'bg-warning',
  urgent: 'bg-orange-500',
  critical: 'bg-critical',
}

export function DocumentCard({
  doc,
  onEdit,
  onDelete,
  onToggleFavorite,
  onSetReminder,
}: DocumentCardProps) {
  const [revealed, setRevealed] = useState(!doc.maskNumber)
  const Icon = resolveIcon(doc.icon ?? CATEGORIES[doc.category]?.icon)

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-4 backdrop-blur-md transition-all duration-300 hover:border-zinc-500/50 hover:shadow-lg hover:shadow-black/5 animate-fade-in',
        doc.status === 'critical' && 'ring-1 ring-critical/30',
      )}
    >
      {/* Header: icon, title, favorite */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-foreground">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug sm:text-base">{doc.title}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate font-mono">
                {revealed ? doc.documentNumber || doc.issuer : maskValue(doc.documentNumber)}
              </span>
              {doc.documentNumber && (
                <button
                  onClick={() => setRevealed((r) => !r)}
                  className="shrink-0 hover:text-foreground"
                  aria-label={revealed ? 'ซ่อนหมายเลขเอกสาร' : 'แสดงหมายเลขเอกสาร'}
                >
                  {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onToggleFavorite}
          aria-pressed={!!doc.favorite}
          aria-label="ปักหมุดเอกสารสำคัญ"
          className={cn(
            'shrink-0 rounded-lg p-1.5 transition-colors hover:bg-accent',
            doc.favorite ? 'text-[#FFC93C]' : 'text-muted-foreground/40',
          )}
        >
          <Star className="h-4 w-4" fill={doc.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Countdown + progress */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className={cn('text-sm font-medium', STATUS_COLOR[doc.status])}>
            {formatDaysRemaining(doc.daysRemaining)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {STATUS_LABEL[doc.status]} · หมดอายุ {formatThaiDate(doc.expiryDate)}
          </span>
        </div>
        <Progress value={doc.progressPct} indicatorClassName={PROGRESS_COLOR[doc.status]} />
      </div>

      {/* Footer: renewal link + overflow actions */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div className="min-w-0 flex-1">
          {doc.renewalUrl ? (
            <a
              href={doc.renewalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{doc.renewalMethod || 'ต่ออายุออนไลน์'}</span>
            </a>
          ) : doc.renewalMethod ? (
            <p className="truncate text-xs text-muted-foreground">{doc.renewalMethod}</p>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              aria-label="ตัวเลือกเพิ่มเติม"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="h-4 w-4" /> แก้ไข
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Bell className="h-4 w-4" /> แจ้งเตือนล่วงหน้า
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuLabel>แจ้งเตือนก่อนหมดอายุ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {REMINDER_CHOICES.map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onSelect={() => onSetReminder(d)}
                    className={cn(doc.reminderDays === d && 'bg-accent/70 font-medium')}
                  >
                    {d} วัน
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-critical focus:text-critical">
              <Trash2 className="h-4 w-4" /> ลบเอกสาร
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
