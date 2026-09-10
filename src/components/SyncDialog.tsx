import { useState } from 'react'
import { CloudCheck, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AuthStatus } from '@/hooks/useAuth'
import type { SyncState } from '@/hooks/useDocuments'

interface SyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: AuthStatus
  email: string | null
  syncState: SyncState
  onSignIn: (email: string) => Promise<{ error: string | null }>
  onSignOut: () => void
}

const SYNC_LABEL: Record<SyncState, string> = {
  idle: '',
  syncing: 'กำลังซิงก์ข้อมูล...',
  synced: 'ซิงก์ข้อมูลล่าสุดแล้ว',
  error: 'ซิงก์ข้อมูลล้มเหลว ลองใหม่ภายหลัง',
}

export function SyncDialog({
  open,
  onOpenChange,
  status,
  email,
  syncState,
  onSignIn,
  onSignOut,
}: SyncDialogProps) {
  const [inputEmail, setInputEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!inputEmail.trim()) return
    setSending(true)
    setError(null)
    const { error: sendError } = await onSignIn(inputEmail.trim())
    setSending(false)
    if (sendError) {
      setError(sendError)
    } else {
      setSent(true)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSent(false)
      setError(null)
      setInputEmail('')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ซิงก์ข้อมูลข้ามอุปกรณ์</DialogTitle>
          <DialogDescription>
            เข้าสู่ระบบครั้งเดียวเพื่อให้ PC และมือถือเห็นรายการเอกสารชุดเดียวกันโดยอัตโนมัติ
            (ไม่ต้องตั้งรหัสผ่าน — ใช้ลิงก์ยืนยันทางอีเมล)
          </DialogDescription>
        </DialogHeader>

        {status === 'signedIn' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-3 py-3">
              <CloudCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div className="space-y-1">
                <p className="text-sm font-medium">เข้าสู่ระบบแล้วด้วย {email}</p>
                <p className="text-xs text-muted-foreground">
                  {syncState === 'syncing'
                    ? SYNC_LABEL.syncing
                    : syncState === 'error'
                      ? SYNC_LABEL.error
                      : 'อุปกรณ์อื่นที่เข้าสู่ระบบด้วยอีเมลเดียวกันจะเห็นข้อมูลชุดนี้ทันที'}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              เปิดแอปนี้บนมือถือ แล้วกดปุ่มซิงก์นี้ → เข้าสู่ระบบด้วยอีเมลเดียวกัน
              ก็จะเห็นเอกสารชุดเดียวกันทันที
            </p>
          </div>
        ) : sent ? (
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-3">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">ส่งลิงก์เข้าสู่ระบบไปที่ {inputEmail} แล้ว</p>
              <p className="text-xs text-muted-foreground">
                เปิดอีเมลแล้วกดลิงก์เพื่อเข้าสู่ระบบ (เช็คโฟลเดอร์สแปมด้วยถ้าไม่เจอ)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sync-email">อีเมล</Label>
              <Input
                id="sync-email"
                type="email"
                placeholder="you@example.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            {error && <p className="text-xs text-critical">{error}</p>}
            <p className="text-xs text-muted-foreground">
              ใช้อีเมลเดียวกันทุกอุปกรณ์ที่ต้องการให้ข้อมูลตรงกัน
              ข้อมูลที่มีอยู่แล้วในเครื่องนี้จะถูกอัปโหลดขึ้นไปให้อัตโนมัติ
            </p>
          </div>
        )}

        <DialogFooter>
          {status === 'signedIn' ? (
            <Button variant="outline" onClick={onSignOut}>
              ออกจากระบบ
            </Button>
          ) : sent ? (
            <Button variant="outline" onClick={() => setSent(false)}>
              ส่งลิงก์อีกครั้ง
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={sending || !inputEmail.trim()}>
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              ส่งลิงก์เข้าสู่ระบบ
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
