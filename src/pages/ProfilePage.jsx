import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export default function ProfilePage() {
  const { user, isAnonymous, signInWithGoogle, signInWithEmail, signOut } = useAuth()
  const [emailOpen, setEmailOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Account'
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  async function run(type, action, successMessage = '') {
    try { setBusy(type); setError(''); setMessage(''); await action(); if (successMessage) setMessage(successMessage) }
    catch (err) { setError(err.message) }
    finally { setBusy('') }
  }

  async function submitEmail(event) {
    event.preventDefault()
    await run('email', () => signInWithEmail(email), 'Check your email to finish protecting this account. Your workouts will remain attached to it.')
  }

  return <section className="page data-page"><p className="eyebrow">Account</p><h1 className="page-title">Profile</h1>
    {isAnonymous ? <>
      <section className="card profile-card"><div className="avatar">G</div><div><p className="metric-label">Current account</p><h2>Guest</h2><span>Temporary anonymous account</span></div></section>
      <section className="card guest-upgrade"><h2>Protect your progress</h2><p className="muted">Your workouts are currently linked to this temporary account. Create an account to protect access across devices.</p>
        <button className="auth-button google" type="button" disabled={Boolean(busy)} onClick={() => run('google', signInWithGoogle)}><b>G</b>{busy === 'google' ? 'Connecting…' : 'Create account with Google'}</button>
        {!emailOpen ? <button className="auth-button" type="button" disabled={Boolean(busy)} onClick={() => setEmailOpen(true)}>✉ <span>Create account with Email</span></button> : <form className="auth-email" onSubmit={submitEmail}><label htmlFor="upgrade-email">Email address</label><input id="upgrade-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required/><button className="auth-button primary" disabled={Boolean(busy)}>{busy === 'email' ? 'Sending…' : 'Protect my account'}</button></form>}
      </section>
    </> : <>
      <section className="card profile-card">{avatarUrl ? <img className="profile-avatar" src={avatarUrl} alt=""/> : <div className="avatar">{name[0]?.toUpperCase()}</div>}<div><p className="metric-label">Signed in as</p><h2>{name}</h2><span>{user?.email || 'Connected account'}</span></div></section>
      <section className="card settings-card"><div><h2>Settings</h2><p className="muted">More account and app preferences will appear here.</p></div><span>Coming soon</span></section>
      <button className="logout-button" type="button" disabled={Boolean(busy)} onClick={() => run('logout', signOut)}>{busy === 'logout' ? 'Signing out…' : 'Sign out'}</button>
    </>}
    {message && <p className="status">{message}</p>}{error && <p className="status error">{error}</p>}
  </section>
}
