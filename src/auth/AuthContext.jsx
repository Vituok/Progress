import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../services/supabase'
import { AuthContext } from './auth-context'
const redirectTo = () => window.location.origin

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) console.error(error)
      setSession(data.session ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) { setSession(nextSession); setLoading(false) }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function signInWithGoogle() {
    if (!supabase) throw new Error('Supabase is not configured.')
    const options = { redirectTo: redirectTo() }
    const result = session?.user?.is_anonymous
      ? await supabase.auth.linkIdentity({ provider: 'google', options })
      : await supabase.auth.signInWithOAuth({ provider: 'google', options })
    if (result.error) throw result.error
    return result.data
  }

  async function signInWithEmail(email) {
    if (!supabase) throw new Error('Supabase is not configured.')
    const normalizedEmail = email.trim().toLocaleLowerCase()
    if (!normalizedEmail) throw new Error('Enter your email address.')
    if (session?.user?.is_anonymous) {
      const { data, error } = await supabase.auth.updateUser({ email: normalizedEmail }, { emailRedirectTo: redirectTo() })
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { emailRedirectTo: redirectTo(), shouldCreateUser: true } })
    if (error) throw error
    return data
  }

  async function continueAnonymously() {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw new Error(`Could not start a guest session. Enable Anonymous Sign-Ins in Supabase. ${error.message}`)
    return data
  }

  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = { user: session?.user ?? null, session, loading, isAnonymous: Boolean(session?.user?.is_anonymous), signInWithGoogle, signInWithEmail, continueAnonymously, signOut, isSupabaseConfigured }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
