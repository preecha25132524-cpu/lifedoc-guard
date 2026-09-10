import { useRef } from 'react'
import {
  CalendarDays,
  Download,
  Plus,
  Search,
  Upload,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CATEGORIES, CATEGORY_ORDER, type CategoryId, type SortKey } from '@/types'

export type StatusFilter = 'all' | 'expiring' | 'expired' | 'safe'

interface ToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  category: CategoryId | 'all'
  onCategoryChange: (v: CategoryId | 'all') => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  sort: SortKey
  onSortChange: (v: SortKey) => void
  onAddClick: () => void
  onExportJson: () => void
  onImportJson: (file: File) => void
  onExportIcs: () => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'safe', label: 'ปลอดภัย' },
  { value: 'expiring', label: 'ใกล้หมดอายุ' },
  { value: 'expired', label: 'หมดอายุ/วิกฤต' },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'expiryAsc', label: 'วันหมดอายุ (ใกล้สุดก่อน)' },
  { value: 'expiryDesc', label: 'วันหมดอายุ (ไกลสุดก่อน)' },
  { value: 'priority', label: 'ความสำคัญ' },
  { value: 'titleAsc', label: 'ชื่อเอกสาร (ก-ฮ)' },
]

export function Toolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  onAddClick,
  onExportJson,
  onImportJson,
  onExportIcs,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาเอกสาร ชื่อ ผู้ออก หรือหมายเลข..."
            className="h-10 rounded-xl pl-9 pr-8"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="ล้างคำค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
            <SelectTrigger className="h-10 w-[9.5rem] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
            <SelectTrigger className="h-10 w-[11rem] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={onAddClick} className="h-10 rounded-xl">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">เพิ่มเอกสาร</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/60">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">เพิ่มเติม</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={onExportJson}>
                <Download className="h-4 w-4" /> ส่งออกข้อมูล (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> นำเข้าข้อมูล (JSON)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onExportIcs}>
                <CalendarDays className="h-4 w-4" /> ส่งออกปฏิทิน (.ics)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImportJson(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryPill
          active={category === 'all'}
          label="ทั้งหมด"
          onClick={() => onCategoryChange('all')}
        />
        {CATEGORY_ORDER.map((id) => (
          <CategoryPill
            key={id}
            active={category === id}
            label={CATEGORIES[id].label}
            onClick={() => onCategoryChange(id)}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryPill({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm',
        active
          ? 'border-primary/50 bg-primary/15 text-primary shadow-sm'
          : 'border-border/50 bg-secondary/40 text-muted-foreground hover:border-zinc-500/50 hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
