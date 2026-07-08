import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

const AuthContext = createContext(null)

const demoUser = {
  id: 'local-demo-user',
  email: 'owner@crafteddigital.local',
  user_metadata: { full_name: 'Crafted Digital Owner' },
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription

    async function loadSession() {
      if (!isSupabaseConfigured) {
        setSession({ user: demoUser })
        setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      subscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession)
      }).data.subscription
      setLoading(false)
    }

    loadSession()
    return () => subscription?.unsubscribe()
  }, [])

  async function signIn(email, password) {
    if (!isSupabaseConfigured) {
      setSession({ user: { ...demoUser, email } })
      return { error: null }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp(email, password, fullName) {
    if (!isSupabaseConfigured) {
      setSession({ user: { ...demoUser, email, user_metadata: { full_name: fullName } } })
      return { error: null }
    }
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: import.meta.env.DEV
          ? 'http://localhost:5173'
          : 'https://joannembl.github.io/crafted-digital-mini-os/',
      },
    })
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setSession({ user: demoUser })
      return
    }
    await supabase.auth.signOut()
  }

  const value = useMemo(() => ({
    user: session?.user ?? null,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isSupabaseConfigured,
  }), [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
