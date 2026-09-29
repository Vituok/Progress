import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export default function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, continueAnonymously, isSupabaseConfigured } = useAuth()
  const [emailOpen, setEmailOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function run(type, action) {
    try { setBusy(type); setError(''); setMessage(''); await action() }
    catch (err) { setError(err.message) }
    finally { setBusy('') }
  }

  async function submitEmail(event) {
    event.preventDefault()
    await run('email', async () => { await signInWithEmail(email); setMessage('Check your email for the secure sign-in link.') })
  }

  return <main className="auth-screen">
    <section className="auth-card">
      <div className="auth-brand"><span>FITNESS</span> PROGRESS</div>
      <p className="eyebrow">Your training, remembered</p>
      <h1>Track every rep.<br/>See your progress.</h1>
      <p className="auth-copy">Build workouts, keep your history, and continue on any device.</p>
      {!isSupabaseConfigured && <p className="status error">Add the Supabase URL and anonymous key to `.env.local`.</p>}
      <button className="auth-button google" type="button" disabled={Boolean(busy)||!isSupabaseConfigured} onClick={() => run('google', signInWithGoogle)}><b>G</b>{busy === 'google' ? 'Connecting…' : 'Continue with Google'}</button>
      {!emailOpen ? <button className="auth-button" type="button" disabled={Boolean(busy)||!isSupabaseConfigured} onClick={() => setEmailOpen(true)}>✉ <span>Continue with Email</span></button> : <form className="auth-email" onSubmit={submitEmail}><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required/><button className="auth-button primary" disabled={Boolean(busy)}>{busy === 'email' ? 'Sending…' : 'Email me a sign-in link'}</button></form>}
      <div className="auth-divider"><span>or</span></div>
      <button className="auth-button guest" type="button" disabled={Boolean(busy)||!isSupabaseConfigured} onClick={() => run('guest', continueAnonymously)}>{busy === 'guest' ? 'Starting…' : 'Continue anonymously'}</button>
      <p className="auth-note">Guest sessions are linked to a private Supabase user ID and persist on this device.</p>
      {message && <p className="status">{message}</p>}{error && <p className="status error">{error}</p>}
    </section>
  </main>
}
