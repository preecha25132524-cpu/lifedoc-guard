import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Paperclip, Sparkles, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DOC_TYPE_CATALOG, findTemplate } from '@/data/docTypeCatalog'
import { readFileAsDataUrl, toDraft } from '@/lib/utils'
import {
  CATEGORIES,
  CATEGORY_ORDER,
  type CategoryId,
  type ComputedDoc,
  type DocumentDraft,
  type ReminderDays,
} from '@/types'

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingDoc: ComputedDoc | null
  onSubmit: (draft: DocumentDraft) => void
}

const REMINDER_OPTIONS: ReminderDays[] = [90, 60, 30, 15, 7]

function emptyDraft(): DocumentDraft {
  return {
    title: '',
    category: 'identity',
    icon: undefined,
    issuer: '',
    documentNumber: '',
    maskNumber: false,
    issueDate: null,
    expiryDate: '',
    reminderDays: 30,
    renewalMethod: '',
    renewalUrl: '',
    notes: '',
    attachmentDataUrl: undefined,
    attachmentName: undefined,
    favorite: false,
  }
}

export function DocumentFormDialog({
  open,
  onOpenChange,
  editingDoc,
  onSubmit,
}: DocumentFormDialogProps) {
  const [draft, setDraft] = useState<DocumentDraft>(emptyDraft())
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!editingDoc

  useEffect(() => {
    if (open) {
      setDraft(editingDoc ? toDraft(editingDoc) : emptyDraft())
      setError(null)
    }
  }, [open, editingDoc])

  function applyTemplate(templateId: string) {
    const tpl = findTemplate(templateId)
    if (!tpl) return
    setDraft((d) => ({
      ...d,
      title: tpl.title,
      category: tpl.category,
      icon: tpl.icon,
      issuer: tpl.issuer,
      maskNumber: tpl.maskByDefault,
      reminderDays: tpl.defaultReminderDays,
      renewalMethod: tpl.renewalMethod,
      renewalUrl: tpl.renewalUrl ?? '',
    }))
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError('ไฟล์แนบต้องมีขนาดไม่เกิน 4MB')
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setDraft((d) => ({ ...d, attachmentDataUrl: dataUrl, attachmentName: file.name }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) {
      setError('กรุณากรอกชื่อเอกสาร')
      return
    }
    if (!draft.expiryDate) {
      setError('กรุณาระบุวันหมดอายุ')
      return
    }
    if (draft.issueDate && draft.issueDate > draft.expiryDate) {
      setError('วันที่ออกเอกสารต้องไม่เกินวันหมดอายุ')
      return
    }
    setError(null)
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      issuer: draft.issuer.trim(),
      documentNumber: draft.documentNumber?.trim() || undefined,
      renewalMethod: draft.renewalMethod?.trim() || undefined,
      renewalUrl: draft.renewalUrl?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสารใหม่'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'ปรับปรุงรายละเอียดเอกสารและการแจ้งเตือน'
              : 'กรอกรายละเอียดเอกสาร หรือเลือกเทมเพลตด้านล่างเพื่อกรอกอัตโนมัติ'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> เทมเพลตเอกสาร (ไม่บังคับ)
              </Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="เลือกประเภทเอกสารจาก 24 รายการ..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {DOC_TYPE_CATALOG.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">ชื่อเอกสาร *</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="เช่น บัตรประจำตัวประชาชน"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>หมวดหมู่ *</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft((d) => ({ ...d, category: v as CategoryId }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ORDER.map((id) => (
                    <SelectItem key={id} value={id}>
                      {CATEGORIES[id].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issuer">หน่วยงาน/ผู้ออกเอกสาร</Label>
              <Input
                id="issuer"
                value={draft.issuer}
                onChange={(e) => setDraft((d) => ({ ...d, issuer: e.target.value }))}
                placeholder="เช่น กรมการปกครอง"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="docNumber">หมายเลขเอกสาร/กรมธรรม์</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="docNumber"
                  value={draft.documentNumber ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, documentNumber: e.target.value }))
                  }
                  placeholder="1-XXXX-XXXXX-XX-X"
                  className="flex-1"
                />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft.maskNumber}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, maskNumber: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                  ปกปิดหมายเลขนี้
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issueDate">วันที่ออกเอกสาร</Label>
              <DatePicker
                id="issueDate"
                value={draft.issueDate}
                onChange={(iso) => setDraft((d) => ({ ...d, issueDate: iso }))}
                placeholder="ไม่ระบุ"
                clearable
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiryDate">วันหมดอายุ *</Label>
              <DatePicker
                id="expiryDate"
                value={draft.expiryDate || null}
                onChange={(iso) => setDraft((d) => ({ ...d, expiryDate: iso ?? '' }))}
                placeholder="เลือกวันหมดอายุ"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>แจ้งเตือนล่วงหน้า</Label>
              <div className="flex flex-wrap gap-1.5">
                {REMINDER_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDraft((prev) => ({ ...prev, reminderDays: d }))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      draft.reminderDays === d
                        ? 'border-primary/50 bg-primary/15 text-primary'
                        : 'border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d} วัน
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="renewalMethod">วิธีต่ออายุ</Label>
              <Input
                id="renewalMethod"
                value={draft.renewalMethod ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, renewalMethod: e.target.value }))
                }
                placeholder="เช่น ต่อออนไลน์ผ่าน DLT Smart Queue"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="renewalUrl">ลิงก์ต่ออายุ</Label>
              <Input
                id="renewalUrl"
                type="url"
                value={draft.renewalUrl ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, renewalUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={draft.notes ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>ไฟล์แนบ / รูปถ่ายเอกสาร</Label>
              {draft.attachmentDataUrl ? (
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{draft.attachmentName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        attachmentDataUrl: undefined,
                        attachmentName: undefined,
                      }))
                    }
                    className="shrink-0 text-muted-foreground hover:text-critical"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 py-3 text-xs text-muted-foreground hover:border-zinc-500/50 hover:text-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" /> แนบไฟล์ (เก็บในเครื่องเท่านั้น, ≤4MB)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs text-critical">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit">{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มเอกสาร'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
