import { ShieldCheck, Moon, Sun, Bell, BellOff, LogIn, UserCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@/lib/storage'
import type { SyncState } from '@/hooks/useDocuments'

interface HeaderProps {
  theme: ThemeMode
  onToggleTheme: () => void
  notificationsSupported: boolean
  notificationsEnabled: boolean
  notificationsPermission: NotificationPermission
  onEnableNotifications: () => void
  onDisableNotifications: () => void
  signedIn: boolean
  email: string | null
  syncState: SyncState
  onOpenSync: () => void
}

export function Header({
  theme,
  onToggleTheme,
  notificationsSupported,
  notificationsEnabled,
  notificationsPermission,
  onEnableNotifications,
  onDisableNotifications,
  signedIn,
  email,
  syncState,
  onOpenSync,
}: HeaderProps) {
  const notificationsBlocked = notificationsPermission === 'denied'
  const notificationsActive = notificationsEnabled && notificationsPermission === 'granted'

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2F7FD8] to-[#16345E] shadow-lg shadow-[#1B5FB8]/25">
            <ShieldCheck className="h-[18px] w-[18px] text-white" />
          </div>
          <h1 className="text-base font-semibold leading-tight tracking-tight">LifeDoc Guard</h1>
        </div>

        <div className="flex items-center gap-2">
          {signedIn && email ? (
            <Button
              variant="outline"
              onClick={onOpenSync}
              aria-label={`เข้าสู่ระบบด้วย ${email} — กดเพื่อดูสถานะหรือออกจากระบบ`}
              title={
                syncState === 'syncing'
                  ? `กำลังซิงก์ข้อมูล... (${email})`
                  : `เข้าสู่ระบบด้วย ${email} — กดเพื่อดูสถานะซิงก์ข้อมูลหรือออกจากระบบ`
              }
              className="h-9 max-w-[8.5rem] gap-1.5 rounded-xl border-primary/50 px-2.5 text-primary sm:max-w-[12rem]"
            >
              {syncState === 'syncing' ? (
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate text-xs font-medium normal-case">{email}</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenSync}
              aria-label="เข้าสู่ระบบ / สมัครสมาชิก"
              title="เข้าสู่ระบบ / สมัครสมาชิก เพื่อซิงก์ข้อมูลข้ามอุปกรณ์ (PC ↔ มือถือ)"
              className="border-border/60"
            >
              <LogIn className="h-4 w-4" />
            </Button>
          )}

          {notificationsSupported && (
            <Button
              variant="outline"
              size="icon"
              onClick={notificationsActive ? onDisableNotifications : onEnableNotifications}
              aria-pressed={notificationsActive}
              aria-label={
                notificationsBlocked
                  ? 'การแจ้งเตือนถูกบล็อกจากเบราว์เซอร์'
                  : notificationsActive
                    ? 'ปิดการแจ้งเตือน'
                    : 'เปิดการแจ้งเตือน'
              }
              title={
                notificationsBlocked
                  ? 'การแจ้งเตือนถูกบล็อกไว้ — เปิดสิทธิ์การแจ้งเตือนของเว็บนี้ในตั้งค่าเบราว์เซอร์'
                  : notificationsActive
                    ? 'แจ้งเตือนเปิดอยู่ — กดเพื่อปิด'
                    : 'กดเพื่อเปิดแจ้งเตือนเมื่อเอกสารใกล้หมดอายุ'
              }
              className={cn(
                'border-border/60',
                notificationsActive && 'border-primary/50 text-primary',
              )}
            >
              {notificationsActive ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleTheme}
            aria-label="สลับธีมสว่าง/มืด"
            className="border-border/60"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
