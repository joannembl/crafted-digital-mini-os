import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { useAuth } from './AuthContext'

const RESEND_COOLDOWN_SECONDS = 30

function isSupabaseRateLimitMessage(message = '') {
  const normalized = message.toLowerCase()
  return normalized.includes('for security purposes') || normalized.includes('request this after') || normalized.includes('rate limit')
}

function friendlyAuthError(message = '', mode = 'signin') {
  const normalized = message.toLowerCase()

  if (isSupabaseRateLimitMessage(message)) {
    return ''
  }

  if (normalized.includes('invalid login credentials')) {
    return 'That email and password combination was not recognized.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.'
  }

  if (normalized.includes('password should be at least')) {
    return 'Please use a longer password.'
  }

  if (mode === 'signup' && normalized.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  return message || 'Something went wrong. Please try again.'
}

export function AuthPage() {
  const { signIn, signUp, resendConfirmation, isSupabaseConfigured } = useAuth()
  const [mode, setMode] = useState('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const canSubmit = useMemo(() => {
    if (submitting) return false
    if (!email.trim() || !password) return false
    if (mode === 'signup' && !fullName.trim()) return false
    return true
  }, [email, fullName, mode, password, submitting])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const intervalId = window.setInterval(() => {
      setResendCooldown((seconds) => Math.max(seconds - 1, 0))
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [resendCooldown])

  function showCheckEmailState(targetEmail) {
    setConfirmationEmail(targetEmail)
    setCheckEmail(true)
    setError('')
    setSuccessMessage('')
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setError('')
    setSuccessMessage('')
    setSubmitting(true)

    try {
      if (mode === 'signin') {
        const result = await signIn(email.trim(), password)
        if (result?.error) setError(friendlyAuthError(result.error.message, mode))
        return
      }

      const cleanEmail = email.trim()
      const result = await signUp(cleanEmail, password, fullName.trim())

      if (result?.error) {
        if (isSupabaseRateLimitMessage(result.error.message)) {
          showCheckEmailState(cleanEmail)
          return
        }
        setError(friendlyAuthError(result.error.message, mode))
        return
      }

      if (result?.data?.localPreview) return
      showCheckEmailState(cleanEmail)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendConfirmation() {
    if (!confirmationEmail || resendCooldown > 0 || resending) return

    setError('')
    setSuccessMessage('')
    setResending(true)

    try {
      const result = await resendConfirmation(confirmationEmail)
      if (result?.error) {
        if (isSupabaseRateLimitMessage(result.error.message)) {
          setResendCooldown(RESEND_COOLDOWN_SECONDS)
          setSuccessMessage('A verification email was already sent. Please check your inbox.')
          return
        }
        setError(friendlyAuthError(result.error.message, 'signup'))
        return
      }

      setSuccessMessage('Verification email resent. Please check your inbox.')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } finally {
      setResending(false)
    }
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setSuccessMessage('')
    setCheckEmail(false)
    setConfirmationEmail('')
    setResendCooldown(0)
  }

  if (checkEmail) {
    return (
      <div className="auth-page">
        <section className="auth-card auth-card-wide">
          <div className="brand center">
            <div className="brand-mark">CD</div>
            <div>
              <strong>Crafted Digital</strong>
              <span>Mini OS</span>
            </div>
          </div>

          <div className="auth-success-icon"><MailCheck size={34} /></div>
          <h1>Check your email</h1>
          <p>We sent a verification link to:</p>
          <div className="email-pill">{confirmationEmail}</div>
          <p className="muted-copy">Click the link in that email to activate the account. After verifying, come back here and sign in.</p>

          {successMessage && <div className="notice">{successMessage}</div>}
          {error && <div className="error">{error}</div>}

          <div className="auth-actions-stack">
            <button
              className="primary-button full-width"
              type="button"
              onClick={() => {
                setMode('signin')
                setCheckEmail(false)
                setPassword('')
                setSuccessMessage('')
                setError('')
              }}
            >
              Go to sign in
            </button>
            <button
              className="secondary-button full-width"
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendCooldown > 0 || resending}
            >
              {resending ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
            </button>
          </div>
        </section>
      </div>
    )
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
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jo-anne" required />
            </label>
          )}
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <div className="password-field">
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary-button" type="submit" disabled={!canSubmit}>
            {submitting ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button className="text-button" type="button" onClick={switchMode}>
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </section>
    </div>
  )
}
