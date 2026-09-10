import { createClient } from '@supabase/supabase-js'

/**
 * LifeDoc Guard cloud sync (optional).
 *
 * These are Supabase's public "anon" project URL + API key — safe to ship
 * in client-side code by design (Supabase's Row Level Security policies on
 * the `documents` table are what actually protect each user's data, not
 * secrecy of this key). Never put the `service_role` secret key here.
 */
const SUPABASE_URL = 'https://mienphdivgwydlvxlwbc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZW5waGRpdmd3eWRsdnhsd2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMTUxNzksImV4cCI6MjEwNDU5MTE3OX0.QZvpUBBmwzBdwt4t9dDfPwj97EUllz5-SD6MpcnT0GM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Magic-link emails often get opened in a different browser context than
    // the one that requested them (Gmail's in-app browser, a different
    // default browser, etc). The default PKCE flow needs a secret stored by
    // the requesting browser, which isn't there in that other context, so
    // the sign-in silently fails. Implicit flow carries the session in the
    // redirect URL itself instead, so it works no matter where the link is
    // opened — the right tradeoff for a magic-link-only, no-password app.
    flowType: 'implicit',
  },
})
