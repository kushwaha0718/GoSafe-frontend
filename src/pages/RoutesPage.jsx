import { useState, useEffect } from 'react'
import { searchRoutes } from '../services/api.js'
import RouteCard from '../components/RouteCard.jsx'
import styles from './RoutesPage.module.css'

export default function RoutesPage({ searchData, onSelectRoute, onBack, routes, setRoutes }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (routes.length === 0) {
      fetchRoutes()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await searchRoutes(searchData.origin, searchData.destination)
      setRoutes(data.routes)
    } catch (err) {
      setError('Failed to fetch routes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!selected) return
    setConfirming(true)
    setTimeout(() => {
      setConfirming(false)
      onSelectRoute(selected)
    }, 800)
  }

  return (
    <div className={styles.container}>
      {/* Journey Summary */}
      <div className={styles.journeyBar}>
        <div className={styles.journeyPoint}>
          <span className={styles.jDot} style={{ background: 'var(--accent-green)' }} />
          <span className={styles.jLabel}>FROM</span>
          <span className={styles.jName}>{searchData.origin}</span>
        </div>
        <div className={styles.journeyArrow}>
          <div className={styles.arrowLine} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        <div className={styles.journeyPoint}>
          <span className={styles.jDot} style={{ background: 'var(--accent-amber)' }} />
          <span className={styles.jLabel}>TO</span>
          <span className={styles.jName}>{searchData.destination}</span>
        </div>
      </div>

      {/* Content */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingAnim}>
              <div className={styles.scanLine} />
              <div className={styles.loadingGrid}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={styles.loadingDot} style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
            <p className={styles.loadingText}>FINDING REAL ROUTES...</p>
            <p className={styles.loadingSubText}>Finding up to 3 alternate road paths → computing safety scores → fetching real nearby shops</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠</span>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={fetchRoutes}>RETRY</button>
          </div>
        ) : (
          <>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionNum}>{routes.length}</span>
                {routes.length === 1 ? 'ROUTE FOUND' : 'ROUTES FOUND'}
              </div>
              <p className={styles.sectionSub}>
                {routes.length > 1
                  ? `${routes.length} different paths found — sorted by safety score. Compare and pick your best option.`
                  : 'Only one drivable path exists between these locations.'}
              </p>
            </div>

            {/* Comparison bar — only show if 2+ routes */}
            {routes.length > 1 && (
              <div className={styles.compareBar}>
                {routes.map((r, i) => {
                  const color = r.safetyScore >= 80 ? 'var(--accent-green)' : r.safetyScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)'
                  return (
                    <div key={r.id} className={`${styles.compareTile} ${selected?.id===r.id?styles.compareTileActive:''}`} onClick={() => setSelected(r)}>
                      <span className={styles.compareTileNum}>0{i+1}</span>
                      <span className={styles.compareTileName}>{r.name}</span>
                      <span className={styles.compareTileSafety} style={{color}}>{r.safetyScore}%</span>
                      <span className={styles.compareTileDetail}>{r.duration}</span>
                      <span className={styles.compareTileDetail}>{r.distance}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className={styles.routesList}>
              {routes.map((route, idx) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  index={idx}
                  isSelected={selected?.id === route.id}
                  onSelect={() => setSelected(route)}
                />
              ))}
            </div>

            {selected && (
              <div className={styles.confirmBar}>
                <div className={styles.selectedInfo}>
                  <span className={styles.selectedLabel}>SELECTED:</span>
                  <span className={styles.selectedName}>{selected.name}</span>
                  <span className={styles.selectedSafety} style={{
                    color: selected.safetyScore >= 80 ? 'var(--accent-green)' :
                           selected.safetyScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)'
                  }}>
                    {selected.safetyScore}% SAFE
                  </span>
                </div>
                <button
                  className={styles.confirmBtn}
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? (
                    <span className={styles.btnLoader} />
                  ) : (
                    <>
                      CONFIRM ROUTE
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
