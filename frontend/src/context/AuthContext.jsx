import { createContext, useContext, useState, useEffect } from 'react'
const Ctx = createContext(null)
const BASE = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('rw_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${BASE()}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); else logout() })
      .catch(logout)
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    const r = await fetch(`${BASE()}/api/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Login failed')
    localStorage.setItem('rw_token', d.token)
    setToken(d.token); setUser(d.user)
  }

  const signup = async (name, email, password) => {
    const r = await fetch(`${BASE()}/api/auth/signup`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, password }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Signup failed')
    localStorage.setItem('rw_token', d.token)
    setToken(d.token); setUser(d.user)
  }

  const logout = () => { localStorage.removeItem('rw_token'); setToken(null); setUser(null) }

  return <Ctx.Provider value={{ user, token, login, signup, logout, loading }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
