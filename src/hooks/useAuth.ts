import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

/**
 * Email + password auth against Supabase. Signing in is entirely optional —
 * the app works fully offline/local without it. Signing in only turns on
 * cross-device sync via the `documents` cloud table.
 *
 * (Switched from passwordless magic-link auth: magic links require an email
 * round-trip on every sign-in, which hit Supabase's free-tier email rate
 * limit during testing and, opened from an email app's in-app browser, could
 * silently fail. Password auth needs email delivery only once, for the
 * optional signup confirmation — not on every sign-in.)
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  // True while the user is mid "reset password" flow: they clicked the
  // reset-password email link, Supabase verified it and briefly signed them
  // in, and fired a PASSWORD_RECOVERY event so we can prompt for a new
  // password instead of dropping them straight into the app.
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setStatus(data.session ? 'signedIn' : 'signedOut')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
      setSession(newSession)
      setStatus(newSession ? 'signedIn' : 'signedOut')
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { error: error?.message ?? null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    return { error: error?.message ?? null }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setPasswordRecovery(false)
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
    if (error) return { error: error.message, needsConfirmation: false }
    // If "Confirm email" is on in Supabase, signUp returns a user but no
    // session yet — the account only becomes usable after the confirmation
    // link is clicked.
    return { error: null, needsConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return {
    status,
    session,
    passwordRecovery,
    user: session?.user ?? null,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }
}
