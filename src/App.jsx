import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import SearchPage from './pages/SearchPage.jsx'
import RoutesPage from './pages/RoutesPage.jsx'
import MapPage from './pages/MapPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import SignupPage from './pages/auth/SignupPage.jsx'
import ProfilePage from './pages/auth/ProfilePage.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'

export default function App() {
  const { loading } = useAuth()
  const [page, setPage]             = useState('search') // search|routes|map|login|signup|profile
  const [searchData, setSearchData] = useState(null)
  const [routes, setRoutes]         = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)

  if (loading) return <LoadingScreen />

  const navigate = (p) => setPage(p)

  const handleSearch = (data) => { setSearchData(data); setRoutes([]); setPage('routes') }
  const handleRouteSelect = (route) => { setSelectedRoute(route); setPage('map') }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar
        currentPage={page}
        onNavigate={navigate}
        onHome={() => setPage('search')}
      />
      {page === 'search'  && <SearchPage onSearch={handleSearch} />}
      {page === 'routes'  && <RoutesPage searchData={searchData} routes={routes} setRoutes={setRoutes} onSelectRoute={handleRouteSelect} onBack={() => setPage('search')} />}
      {page === 'map'     && <MapPage route={selectedRoute} searchData={searchData} onBack={() => setPage('routes')} onNavigate={navigate} />}
      {page === 'login'   && <LoginPage onSuccess={() => setPage('search')} onSwitch={() => setPage('signup')} />}
      {page === 'signup'  && <SignupPage onSuccess={() => setPage('search')} onSwitch={() => setPage('login')} />}
      {page === 'profile' && <ProfilePage onNavigate={navigate} />}
    </div>
  )
}
