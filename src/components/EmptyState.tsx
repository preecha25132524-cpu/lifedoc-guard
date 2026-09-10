import { FolderSearch, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  hasFilters: boolean
  onAddClick: () => void
  onClearFilters: () => void
}

export function EmptyState({ hasFilters, onAddClick, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60">
        {hasFilters ? (
          <FolderSearch className="h-7 w-7 text-muted-foreground" />
        ) : (
          <PackagePlus className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium">ไม่พบเอกสารที่ตรงกับตัวกรอง</p>
          <p className="mt-1 text-xs text-muted-foreground">
            ลองปรับคำค้นหาหรือหมวดหมู่ดูอีกครั้ง
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
            ล้างตัวกรองทั้งหมด
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium">ยังไม่มีเอกสารในระบบ</p>
          <p className="mt-1 text-xs text-muted-foreground">
            เริ่มต้นด้วยการเพิ่มเอกสารสำคัญของคุณ หรือกู้คืนจากไฟล์สำรองข้อมูล
          </p>
          <Button size="sm" className="mt-4" onClick={onAddClick}>
            เพิ่มเอกสารแรกของคุณ
          </Button>
        </>
      )}
    </div>
  )
}
