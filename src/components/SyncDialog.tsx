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
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  onSignOut: () => void
}

const SYNC_LABEL: Record<SyncState, string> = {
  idle: '',
  syncing: 'กำลังซิงก์ข้อมูล...',
  synced: 'ซิงก์ข้อมูลล่าสุดแล้ว',
  error: 'ซิงก์ข้อมูลล้มเหลว ลองใหม่ภายหลัง',
}

type Mode = 'signin' | 'signup'

export function SyncDialog({
  open,
  onOpenChange,
  status,
  email,
  syncState,
  onSignIn,
  onSignUp,
  onSignOut,
}: SyncDialogProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [inputEmail, setInputEmail] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!inputEmail.trim() || !inputPassword) return
    setSubmitting(true)
    setError(null)
    if (mode === 'signin') {
      const { error: signInError } = await onSignIn(inputEmail, inputPassword)
      setSubmitting(false)
      if (signInError) setError(translateAuthError(signInError))
    } else {
      const { error: signUpError, needsConfirmation: needsConfirm } = await onSignUp(
        inputEmail,
        inputPassword,
      )
      setSubmitting(false)
      if (signUpError) {
        setError(translateAuthError(signUpError))
      } else if (needsConfirm) {
        setNeedsConfirmation(true)
      }
      // If !needsConfirm, Supabase already returned a session — the dialog
      // will flip to the signed-in view automatically via auth state.
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNeedsConfirmation(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setInputEmail('')
      setInputPassword('')
      setError(null)
      setNeedsConfirmation(false)
      setMode('signin')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ซิงก์ข้อมูลข้ามอุปกรณ์</DialogTitle>
          <DialogDescription>
            เข้าสู่ระบบด้วยบัญชีเดียวกันบน PC และมือถือ เพื่อให้เห็นรายการเอกสารชุดเดียวกันโดยอัตโนมัติ
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
                      : 'อุปกรณ์อื่นที่เข้าสู่ระบบด้วยบัญชีเดียวกันจะเห็นข้อมูลชุดนี้ทันที'}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              เปิดแอปนี้บนมือถือ แล้วกดปุ่มซิงก์นี้ → เข้าสู่ระบบด้วยอีเมล/รหัสผ่านเดียวกัน
              ก็จะเห็นเอกสารชุดเดียวกันทันที
            </p>
          </div>
        ) : needsConfirmation ? (
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-3">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">สมัครสมาชิกสำเร็จ — ยืนยันอีเมล {inputEmail} ก่อนเข้าใช้งาน</p>
              <p className="text-xs text-muted-foreground">
                เช็คอีเมลแล้วกดลิงก์ยืนยัน (เช็คโฟลเดอร์สแปมด้วยถ้าไม่เจอ) จากนั้นกลับมาเข้าสู่ระบบด้วยรหัสผ่านที่ตั้งไว้
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                  mode === 'signin' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                  mode === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                สมัครสมาชิก
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sync-email">อีเมล</Label>
              <Input
                id="sync-email"
                type="email"
                placeholder="you@example.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sync-password">รหัสผ่าน</Label>
              <Input
                id="sync-password"
                type="password"
                placeholder={mode === 'signup' ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'}
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            {error && <p className="text-xs text-critical">{error}</p>}
            <p className="text-xs text-muted-foreground">
              {mode === 'signup'
                ? 'ใช้บัญชีเดียวกันทุกอุปกรณ์ที่ต้องการให้ข้อมูลตรงกัน ข้อมูลที่มีอยู่แล้วในเครื่องนี้จะถูกอัปโหลดขึ้นไปให้อัตโนมัติ'
                : 'ใช้บัญชีเดียวกันทุกอุปกรณ์ที่ต้องการให้ข้อมูลตรงกัน'}
            </p>
          </div>
        )}

        <DialogFooter>
          {status === 'signedIn' ? (
            <Button variant="outline" onClick={onSignOut}>
              ออกจากระบบ
            </Button>
          ) : needsConfirmation ? (
            <Button variant="outline" onClick={() => setNeedsConfirmation(false)}>
              กลับไปเข้าสู่ระบบ
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !inputEmail.trim() || inputPassword.length < 6}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  if (m.includes('user already registered')) return 'อีเมลนี้สมัครสมาชิกไว้แล้ว ลองเข้าสู่ระบบแทน'
  if (m.includes('password should be at least')) return 'รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)'
  if (m.includes('email not confirmed')) return 'ยังไม่ได้ยืนยันอีเมล กรุณาเช็คกล่องจดหมาย'
  if (m.includes('email rate limit')) return 'ส่งอีเมลถี่เกินไป กรุณารอสักครู่แล้วลองใหม่'
  return message
}
