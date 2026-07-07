import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)
const STORAGE_KEY = 'interclubs_session'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setSession(JSON.parse(raw))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  async function login(username, password) {
    const { data, error } = await supabase
      .from('admins')
      .select('id, username, role, club_id, password')
      .eq('username', username)
      .maybeSingle()

    if (error) return { ok: false, message: "Erreur de connexion au serveur." }
    if (!data || data.password !== password) {
      return { ok: false, message: 'Identifiant ou mot de passe incorrect.' }
    }

    const nextSession = {
      id: data.id,
      username: data.username,
      role: data.role, // 'main' | 'secondary'
      clubId: data.club_id,
    }
    setSession(nextSession)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    return { ok: true }
  }

  function logout() {
    setSession(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const isMainAdmin = session?.role === 'main'

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, isMainAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
