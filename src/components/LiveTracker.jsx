import styles from './LiveTracker.module.css'

export default function LiveTracker({ userLocation, route }) {
  if (!userLocation) {
    return (
      <div className={styles.tracker}>
        <div className={styles.trackerHeader}>
          <span className={styles.trackerDot} />
          LIVE TRACKING
        </div>
        <p className={styles.acquiring}>Acquiring GPS signal...</p>
      </div>
    )
  }

  // Estimate distance to destination (simple Haversine)
  const destWp = route.waypoints?.[route.waypoints.length - 1]
  let distToDest = null
  if (destWp) {
    const R = 6371e3
    const φ1 = (userLocation.lat * Math.PI) / 180
    const φ2 = (destWp.lat * Math.PI) / 180
    const Δφ = ((destWp.lat - userLocation.lat) * Math.PI) / 180
    const Δλ = ((destWp.lng - userLocation.lng) * Math.PI) / 180
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    distToDest = d < 1000 ? `${Math.round(d)}m` : `${(d/1000).toFixed(1)}km`
  }

  return (
    <div className={styles.tracker}>
      <div className={styles.trackerHeader}>
        <span className={styles.trackerDot} />
        LIVE TRACKING ACTIVE
      </div>
      <div className={styles.locInfo}>
        <div className={styles.locRow}>
          <span className={styles.locLabel}>LAT</span>
          <span className={styles.locVal}>{userLocation.lat.toFixed(5)}</span>
        </div>
        <div className={styles.locRow}>
          <span className={styles.locLabel}>LNG</span>
          <span className={styles.locVal}>{userLocation.lng.toFixed(5)}</span>
        </div>
        <div className={styles.locRow}>
          <span className={styles.locLabel}>ACCURACY</span>
          <span className={styles.locVal}>{Math.round(userLocation.accuracy || 0)}m</span>
        </div>
        {distToDest && (
          <div className={styles.locRow}>
            <span className={styles.locLabel}>TO DEST</span>
            <span className={styles.locVal} style={{ color: 'var(--accent-amber)' }}>
              ~{distToDest}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
