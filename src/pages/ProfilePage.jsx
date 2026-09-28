import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser, logout } from '../services/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signedOut, setSignedOut] = useState(false)
  useEffect(() => { let active = true; getCurrentUser().then((value) => active && setUser(value)).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false)); return () => { active = false } }, [])
  async function signOut() { try { setError(''); await logout(); setUser(null); setSignedOut(true) } catch (err) { setError(err.message) } }
  return <section className="page data-page"><p className="eyebrow">Account</p><h1 className="page-title">Profile</h1>
    {loading && <p className="status">Loading account…</p>}{error && <p className="status error">{error}</p>}
    {signedOut && <div className="card profile-empty"><h2>Signed out</h2><p className="muted">Your local session has ended.</p><Link className="secondary-button" to="/">Go home</Link></div>}
    {user && <><section className="card profile-card"><div className="avatar">{user.email?.[0]?.toUpperCase() || 'A'}</div><div><p className="metric-label">Signed in as</p><h2>{user.email || 'Anonymous user'}</h2><span>{user.is_anonymous ? 'Anonymous account' : 'Email account'}</span></div></section><section className="card settings-card"><div><h2>Settings</h2><p className="muted">More account and app preferences will appear here.</p></div><span>Coming soon</span></section><button className="logout-button" type="button" onClick={signOut}>Log out</button></>}
  </section>
}
