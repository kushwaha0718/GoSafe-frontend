import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('gs_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const searchRoutes = async (origin, destination) => {
  const r = await api.post('/routes/search', { origin, destination })
  return r.data
}

export const getLocationSuggestions = async (query) => {
  if (!query || query.trim().length < 2) return []
  try { const r = await api.get('/stations', { params: { q: query } }); return r.data.stations || [] }
  catch { return [] }
}

export const getNearbyPlaces = async (query, coords) => {
  if (!query || query.trim().length < 2) return []
  try { const r = await api.get('/stations', { params: { q: query, lat: coords.lat, lng: coords.lng } }); return r.data.stations || [] }
  catch { return [] }
}
