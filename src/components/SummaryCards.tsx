import { FileStack, ShieldCheck, TriangleAlert, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComputedDoc } from '@/types'

interface SummaryCardsProps {
  documents: ComputedDoc[]
}

export function SummaryCards({ documents }: SummaryCardsProps) {
  const total = documents.length
  const safe = documents.filter((d) => d.status === 'active').length
  const expiringSoon = documents.filter(
    (d) => d.status === 'expiring' || d.status === 'urgent',
  ).length
  const expired = documents.filter((d) => d.status === 'critical').length

  const cards = [
    {
      label: 'เอกสารทั้งหมด',
      value: total,
      icon: FileStack,
      accent: 'text-primary',
    },
    {
      label: 'ปลอดภัย',
      value: safe,
      icon: ShieldCheck,
      accent: 'text-success',
    },
    {
      label: 'ใกล้หมดอายุ',
      value: expiringSoon,
      icon: TriangleAlert,
      accent: 'text-warning',
    },
    {
      label: 'หมดอายุแล้ว',
      value: expired,
      icon: CircleX,
      accent: 'text-critical',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/70 p-4 backdrop-blur-md transition-all duration-300 hover:border-zinc-500/50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/80">
            <c.icon className={cn('h-[18px] w-[18px]', c.accent)} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{c.label}</p>
            <p className="text-xl font-semibold tabular-nums tracking-tight">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
