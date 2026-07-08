import { useState } from 'react'
import { useAuth } from './AuthContext'

export function AuthPage() {
  const { signIn, signUp, isSupabaseConfigured } = useAuth()
  const [mode, setMode] = useState('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName)
    if (result?.error) setError(result.error.message)
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="brand center">
          <div className="brand-mark">CD</div>
          <div>
            <strong>Crafted Digital</strong>
            <span>Mini OS</span>
          </div>
        </div>
        <h1>{mode === 'signin' ? 'Welcome back' : 'Create your owner account'}</h1>
        <p>Simple prospecting, demo tracking, follow-ups, and notes for your website agency.</p>

        {!isSupabaseConfigured && (
          <div className="notice">Supabase keys are not set yet. This screen works in local preview mode.</div>
        )}

        <form onSubmit={handleSubmit} className="form-stack">
          {mode === 'signup' && (
            <label>
              Full name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jo-anne" />
            </label>
          )}
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" required />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary-button" type="submit">{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>

        <button className="text-button" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </section>
    </div>
  )
}
