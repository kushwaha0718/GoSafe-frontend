import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './MapPage.module.css'
import RouteMap from '../components/RouteMap.jsx'
import LiveTracker from '../components/LiveTracker.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function MapPage({ route, searchData, onBack, onNavigate }) {
  const { isLoggedIn, saveRoute, getContacts } = useAuth()
  const [tracking, setTracking]           = useState(false)
  const [userLocation, setUserLocation]   = useState(null)
  const [locationError, setLocationError] = useState('')
  const [sidebarOpen, setSidebarOpen]     = useState(true)
  const [saved, setSaved]                 = useState(false)

  // SOS state
  const [contacts, setContacts]           = useState([])
  const [sosSending, setSosSending]       = useState(false)
  const [sosSuccess, setSosSuccess]       = useState(false)
  const [sosError, setSosError]           = useState('')
  const [showSosModal, setShowSosModal]   = useState(false)

  const watchRef = useRef(null)

  const safetyColor = route.safetyScore >= 80 ? 'var(--accent-green)' :
                      route.safetyScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)'

  // Load emergency contacts once if logged in
  useEffect(() => {
    if (isLoggedIn) {
      getContacts().then(setContacts).catch(() => {})
    }
  }, [isLoggedIn])

  const handleTrackToggle = useCallback(() => {
    if (tracking) {
      if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null }
      setTracking(false); setUserLocation(null); setLocationError('')
    } else {
      if (!navigator.geolocation) { setLocationError('Geolocation not supported.'); return }
      setTracking(true); setLocationError('')
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        ()    => { setLocationError('Location access denied.'); setTracking(false) },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      )
    }
  }, [tracking])

  useEffect(() => () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }, [])

  const handleSave = async () => {
    if (!isLoggedIn) return
    await saveRoute({ origin: searchData.origin, destination: searchData.destination, route_name: route.name, route_data: { distance: route.distance, duration: route.duration, safetyScore: route.safetyScore } })
    setSaved(true)
  }

  // ── SOS ───────────────────────────────────────────────────────────────────
  const sendSOS = () => {
    if (!isLoggedIn) { setSosError('Sign in to use SOS.'); return }
    if (contacts.length === 0) { setShowSosModal(true); return }
    setSosSending(true); setSosError('')

    if (!navigator.geolocation) {
      dispatchSOS(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => dispatchSOS({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => dispatchSOS(null),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const dispatchSOS = (loc) => {
    const mapsLink = loc
      ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
      : 'Location unavailable'

    const msg = encodeURIComponent(
      `🆘 *SOS ALERT from GoSafe*\n\n` +
      `I need help! I'm currently travelling and may be in danger.\n\n` +
      `📍 *My live location:*\n${mapsLink}\n\n` +
      `🛣️ *Route:* ${searchData.origin} → ${searchData.destination}\n\n` +
      `Please check on me immediately. This message was sent via GoSafe.`
    )

    // Open WhatsApp for each contact (opens tabs)
    contacts.forEach((contact, i) => {
      const phone = contact.phone.replace(/[^0-9]/g, '') // strip non-digits
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
      }, i * 800) // stagger slightly so browser doesn't block multiple popups
    })

    setSosSending(false)
    setSosSuccess(true)
    setTimeout(() => setSosSuccess(false), 5000)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          ROUTES
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.logoIcon}>◈</span>
          <div className={styles.routeTitle}>
            <span className={styles.routeLabel}>ACTIVE ROUTE</span>
            <span className={styles.routeName}>{route.name}</span>
          </div>
          <div className={styles.routeBadges}>
            <span className={styles.safetyChip} style={{color: safetyColor, borderColor: safetyColor}}>{route.safetyScore}% SAFE</span>
            <span className={styles.distChip}>{route.distance}</span>
            <span className={styles.distChip}>{route.duration}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {isLoggedIn && (
            <button className={`${styles.saveBtn} ${saved?styles.saveBtnDone:''}`} onClick={handleSave} disabled={saved}>
              {saved ? '✓ SAVED' : '+ SAVE'}
            </button>
          )}
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◧' : '◨'} INFO
          </button>
        </div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        <div className={`${styles.mapWrap} ${!sidebarOpen ? styles.mapFull : ''}`}>
          <RouteMap route={route} userLocation={userLocation} tracking={tracking} />
        </div>

        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>SAFETY ANALYSIS</div>
              <div className={styles.safetyBlock}>
                <div className={styles.safetyScore} style={{ color: safetyColor }}>{route.safetyScore}%</div>
                <div className={styles.safetyBar}><div className={styles.safetyFill} style={{ width: `${route.safetyScore}%`, background: safetyColor }} /></div>
                <div className={styles.safetyFactors}>
                  {route.safetyFactors?.map((f, i) => (
                    <div key={i} className={styles.factor}>
                      <span className={styles.factorDot} style={{ background: f.score>=70?'var(--accent-green)':f.score>=50?'var(--accent-amber)':'var(--accent-red)' }} />
                      <span className={styles.factorName}>{f.name}</span>
                      <span className={styles.factorScore}>{f.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>ROUTE DETAILS</div>
              <div className={styles.detailsList}>
                {[['FROM', searchData.origin],['TO', searchData.destination],['DURATION', route.duration],['DISTANCE', route.distance],['TRANSFERS', route.transfers]].map(([l,v]) => (
                  <div key={l} className={styles.detail}>
                    <span className={styles.detailLabel}>{l}</span>
                    <span className={styles.detailValue}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>
                SHOPS & BRANDS
                <span className={styles.shopCount}>{route.totalShops}</span>
              </div>
              {route.shops?.length > 0 ? (
                <div className={styles.shopsList}>
                  {route.shops.map((shop, i) => (
                    <div key={i} className={styles.shopItem}>
                      <div className={styles.shopIcon} style={{ background: shop.color || 'var(--bg-elevated)' }}>{shop.icon || '🏪'}</div>
                      <div className={styles.shopInfo}>
                        <span className={styles.shopName}>{shop.name}</span>
                        <span className={styles.shopStation}>{shop.station}</span>
                      </div>
                      <span className={styles.shopCat}>{shop.category}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.shopsEmpty}>No OSM shop data found for this route segment.</p>
              )}
            </div>

            {tracking && <LiveTracker userLocation={userLocation} route={route} />}
          </aside>
        )}
      </div>

      {/* ── BOTTOM BAR: Track + SOS ── */}
      <div className={styles.trackBar}>
        {locationError && <p className={styles.locError}>⚠ {locationError}</p>}
        {sosError && <p className={styles.locError}>⚠ {sosError}</p>}
        {sosSuccess && <p className={styles.sosSuccessMsg}>✓ SOS sent via WhatsApp!</p>}

        <button
          className={`${styles.trackBtn} ${tracking ? styles.trackBtnActive : ''}`}
          onClick={handleTrackToggle}
        >
          {tracking ? (
            <><span className={styles.trackDot} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v2M12 16v2M6 12H4M20 12h-2"/></svg>
              LIVE TRACKING — STOP</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v2M12 16v2M6 12H4M20 12h-2"/></svg>
              TRACK MY LOCATION</>
          )}
        </button>

        {/* SOS BUTTON */}
        <button
          className={`${styles.sosBtn} ${sosSending ? styles.sosBtnSending : ''} ${sosSuccess ? styles.sosBtnSuccess : ''}`}
          onClick={sendSOS}
          disabled={sosSending}
          title="Send SOS to emergency contacts via WhatsApp"
        >
          {sosSuccess ? (
            <>✓ SOS SENT</>
          ) : sosSending ? (
            <><span className={styles.sosLoader}/>SENDING…</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              SOS
            </>
          )}
        </button>
      </div>

      {/* ── No contacts modal ── */}
      {showSosModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSosModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🆘</div>
            <h3 className={styles.modalTitle}>No Emergency Contacts</h3>
            <p className={styles.modalText}>
              You haven't added any emergency contacts yet. Go to your profile to add a friend or family member's WhatsApp number.
            </p>
            <div className={styles.modalBtns}>
              <button className={styles.modalCancel} onClick={() => setShowSosModal(false)}>CANCEL</button>
              <button className={styles.modalAction} onClick={() => { setShowSosModal(false); onNavigate && onNavigate('profile') }}>
                GO TO PROFILE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
