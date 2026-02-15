import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const api = axios.create({ baseURL: '/api', timeout: 15000 })

// Attach token to every request automatically
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('gs_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true) // true while checking stored token

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('gs_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => localStorage.removeItem('gs_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('gs_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password })
    localStorage.setItem('gs_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gs_token')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (formData) => {
    const { data } = await api.patch('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    setUser(data.user)
    return data.user
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
    return data
  }, [])

  const getHistory = useCallback(() => api.get('/auth/history').then(r => r.data.history), [])
  const getSavedRoutes = useCallback(() => api.get('/auth/saved-routes').then(r => r.data.routes), [])
  const saveRoute = useCallback((payload) => api.post('/auth/saved-routes', payload), [])
  const deleteSavedRoute = useCallback((id) => api.delete(`/auth/saved-routes/${id}`), [])

  // Emergency contacts
  const getContacts    = useCallback(() => api.get('/contacts').then(r => r.data.contacts), [])
  const addContact     = useCallback((data) => api.post('/contacts', data).then(r => r.data.contact), [])
  const deleteContact  = useCallback((id) => api.delete(`/contacts/${id}`), [])

  return (
    <AuthContext.Provider value={{
      user, loading, login, signup, logout,
      updateProfile, changePassword,
      getHistory, getSavedRoutes, saveRoute, deleteSavedRoute,
      getContacts, addContact, deleteContact,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
