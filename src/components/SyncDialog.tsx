import { useState } from 'react'
import { CloudCheck, KeyRound, Loader2, MailCheck } from 'lucide-react'
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
  passwordRecovery: boolean
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  onSignOut: () => void
  onResetPassword: (email: string) => Promise<{ error: string | null }>
  onUpdatePassword: (newPassword: string) => Promise<{ error: string | null }>
}

const SYNC_LABEL: Record<SyncState, string> = {
  idle: '',
  syncing: 'กำลังซิงก์ข้อมูล...',
  synced: 'ซิงก์ข้อมูลล่าสุดแล้ว',
  error: 'ซิงก์ข้อมูลล้มเหลว ลองใหม่ภายหลัง',
}

type Mode = 'signin' | 'signup' | 'forgot'

export function SyncDialog({
  open,
  onOpenChange,
  status,
  email,
  syncState,
  passwordRecovery,
  onSignIn,
  onSignUp,
  onSignOut,
  onResetPassword,
  onUpdatePassword,
}: SyncDialogProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [inputEmail, setInputEmail] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New-password fields, used only while passwordRecovery is true.
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

  async function handleSubmit() {
    if (mode === 'forgot') {
      if (!inputEmail.trim()) return
      setSubmitting(true)
      setError(null)
      const { error: resetError } = await onResetPassword(inputEmail)
      setSubmitting(false)
      if (resetError) setError(translateAuthError(resetError))
      else setResetSent(true)
      return
    }

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

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      setError('รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: updateError } = await onUpdatePassword(newPassword)
    setSubmitting(false)
    if (updateError) {
      setError(translateAuthError(updateError))
    } else {
      setNewPassword('')
      setNewPasswordConfirm('')
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNeedsConfirmation(false)
    setResetSent(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setInputEmail('')
      setInputPassword('')
      setError(null)
      setNeedsConfirmation(false)
      setResetSent(false)
      setMode('signin')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {passwordRecovery ? 'ตั้งรหัสผ่านใหม่' : 'ซิงก์ข้อมูลข้ามอุปกรณ์'}
          </DialogTitle>
          <DialogDescription>
            {passwordRecovery
              ? 'ตั้งรหัสผ่านใหม่สำหรับบัญชีนี้ แล้วใช้รหัสผ่านนี้เข้าสู่ระบบในอุปกรณ์อื่นๆ'
              : 'เข้าสู่ระบบด้วยบัญชีเดียวกันบน PC และมือถือ เพื่อให้เห็นรายการเอกสารชุดเดียวกันโดยอัตโนมัติ'}
          </DialogDescription>
        </DialogHeader>

        {passwordRecovery ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-3">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm">ยืนยันลิงก์รีเซ็ตรหัสผ่านแล้ว ตั้งรหัสผ่านใหม่ด้านล่างนี้ได้เลย</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password-confirm">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="new-password-confirm"
                type="password"
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
              />
            </div>
            {error && <p className="text-xs text-critical">{error}</p>}
          </div>
        ) : status === 'signedIn' ? (
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
        ) : mode === 'forgot' ? (
          resetSent ? (
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-3">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ {inputEmail} แล้ว</p>
                <p className="text-xs text-muted-foreground">
                  เช็คอีเมล (รวมโฟลเดอร์สแปม) แล้วกดลิงก์เพื่อตั้งรหัสผ่านใหม่
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">อีเมล</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              {error && <p className="text-xs text-critical">{error}</p>}
              <p className="text-xs text-muted-foreground">
                จะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลนี้
              </p>
            </div>
          )
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
              <div className="flex items-center justify-between">
                <Label htmlFor="sync-password">รหัสผ่าน</Label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-primary hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
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
          {passwordRecovery ? (
            <Button
              onClick={handleUpdatePassword}
              disabled={submitting || newPassword.length < 6 || newPasswordConfirm.length < 6}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึกรหัสผ่านใหม่
            </Button>
          ) : status === 'signedIn' ? (
            <Button variant="outline" onClick={onSignOut}>
              ออกจากระบบ
            </Button>
          ) : needsConfirmation ? (
            <Button variant="outline" onClick={() => setNeedsConfirmation(false)}>
              กลับไปเข้าสู่ระบบ
            </Button>
          ) : mode === 'forgot' ? (
            resetSent ? (
              <Button variant="outline" onClick={() => switchMode('signin')}>
                กลับไปเข้าสู่ระบบ
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => switchMode('signin')}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || !inputEmail.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  ส่งลิงก์รีเซ็ตรหัสผ่าน
                </Button>
              </>
            )
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
  if (m.includes('user not found')) return 'ไม่พบบัญชีที่ใช้อีเมลนี้'
  if (m.includes('same password')) return 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม'
  return message
}
