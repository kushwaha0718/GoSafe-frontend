import { useState, useEffect, useRef } from 'react'
import { getLocationSuggestions, getNearbyPlaces } from '../services/api.js'
import styles from './SearchPage.module.css'

/** Debounce — only fires after the user stops typing for `delay` ms */
function useDebounce(value, delay) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

export default function SearchPage({ onSearch }) {
  const [origin, setOrigin]           = useState('')
  const [destination, setDestination] = useState('')

  // originCoords is set ONLY when the user explicitly picks a suggestion
  // or uses GPS — NOT on every keystroke. This stops dest from losing its bias.
  const [originCoords, setOriginCoords] = useState(null)

  const [originSugg, setOriginSugg] = useState([])
  const [destSugg,   setDestSugg]   = useState([])
  const [originFetching, setOriginFetching] = useState(false)
  const [destFetching,   setDestFetching]   = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError,   setGpsError]   = useState('')
  const [focusField, setFocusField] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  // Track whether origin text was set programmatically (GPS / suggestion pick)
  // so we don't fire a suggestion search for it
  const originSetByCode = useRef(false)

  const dbOrigin = useDebounce(origin, 380)
  const dbDest   = useDebounce(destination, 380)

  // ── Origin autocomplete (skip when set by code) ───────────────────────────
  useEffect(() => {
    if (originSetByCode.current) { originSetByCode.current = false; return }
    if (dbOrigin.length < 2) { setOriginSugg([]); return }
    setOriginFetching(true)
    getLocationSuggestions(dbOrigin)
      .then(setOriginSugg)
      .finally(() => setOriginFetching(false))
  }, [dbOrigin])

  // ── Destination autocomplete (biased to origin area when coords known) ────
  useEffect(() => {
    if (dbDest.length < 2) { setDestSugg([]); return }
    setDestFetching(true)
    const req = originCoords
      ? getNearbyPlaces(dbDest, originCoords)
      : getLocationSuggestions(dbDest)
    req.then(setDestSugg).finally(() => setDestFetching(false))
  }, [dbDest, originCoords])

  // ── GPS current location ──────────────────────────────────────────────────
  const handleGPS = () => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported.'); return }
    setGpsLoading(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setOriginCoords({ lat, lng })
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'User-Agent': 'GoSafe/1.0' } }
          )
          const data = await res.json()
          const a    = data.address || {}
          // Build a human-readable label: most specific available piece + city
          const specific = a.amenity || a.building || a.road || a.neighbourhood || a.suburb || ''
          const city     = a.city || a.town || a.village || a.county || ''
          const label    = specific && city
            ? `${specific}, ${city}`
            : specific || city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          originSetByCode.current = true
          setOrigin(label)
        } catch {
          originSetByCode.current = true
          setOrigin(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
        setOriginSugg([])
        setGpsLoading(false)
      },
      () => { setGpsError('Location access denied.'); setGpsLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Pick a suggestion ─────────────────────────────────────────────────────
  const pick = (field, s) => {
    if (field === 'origin') {
      originSetByCode.current = true
      setOrigin(s.name)
      setOriginCoords({ lat: s.lat, lng: s.lng })
      setOriginSugg([])
    } else {
      setDestination(s.name)
      setDestSugg([])
    }
  }

  const swap = () => {
    originSetByCode.current = true
    const tmp = origin
    setOrigin(destination)
    setDestination(tmp)
    setOriginCoords(null) // coords unknown after swap; dest will search India-wide
    setOriginSugg([])
    setDestSugg([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) { setError('Both fields are required.'); return }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Origin and destination must be different.')
      return
    }
    setError('')
    setSubmitting(true)
    // Small delay so button feedback is visible before re-render
    setTimeout(() => {
      setSubmitting(false)
      onSearch({ origin: origin.trim(), destination: destination.trim() })
    }, 200)
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroText}>
          <div className={styles.tagline}><span className={styles.taglineDot} />FIND YOUR SAFEST PATH</div>
          <h1 className={styles.title}>Where are you<br /><span className={styles.titleAccent}>headed today?</span></h1>
          <p className={styles.subtitle}>
            Real routing across all of India — any city, station, or landmark.<br />
            Safety scores, real nearby shops &amp; live GPS tracking.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>

            {/* ── ORIGIN ─────────────────────────────────────────────── */}
            <div className={styles.inputWrapper}>
              <div className={styles.labelRow}>
                <label className={styles.label}><span className={styles.labelIcon}>○</span>ORIGIN</label>
                <button type="button" className={`${styles.gpsBtn} ${gpsLoading ? styles.gpsBtnLoading : ''}`}
                  onClick={handleGPS} disabled={gpsLoading}>
                  {gpsLoading
                    ? <span className={styles.miniLoader} />
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                      </svg>
                  }
                  USE MY LOCATION
                </button>
              </div>
              <div className={styles.inputContainer}>
                <input className={styles.input} type="text" value={origin}
                  onChange={e => { setOrigin(e.target.value); setOriginCoords(null) }}
                  onFocus={() => setFocusField('origin')}
                  onBlur={() => setTimeout(() => setFocusField(null), 180)}
                  placeholder="Mumbai CST, Connaught Place, Howrah…"
                  autoComplete="off" spellCheck="false" />
                {originFetching && <span className={styles.fieldLoader} />}
                {focusField === 'origin' && originSugg.length > 0 && (
                  <ul className={styles.suggestions}>
                    {originSugg.map(s => (
                      <li key={s.id} className={styles.suggestionItem} onMouseDown={() => pick('origin', s)}>
                        <span className={styles.sugDot} style={{ background: 'var(--accent-green)' }} />
                        <span className={styles.sugBody}>
                          <span className={styles.sugName}>{s.name}</span>
                          {s.sub && <span className={styles.sugSub}>{s.sub}</span>}
                        </span>
                        {s.type && <span className={styles.sugType}>{s.type}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {gpsError && <p className={styles.gpsError}>⚠ {gpsError}</p>}
            </div>

            {/* ── SWAP ────────────────────────────────────────────────── */}
            <button type="button" className={styles.swapBtn} onClick={swap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </button>

            {/* ── DESTINATION ─────────────────────────────────────────── */}
            <div className={styles.inputWrapper}>
              <div className={styles.labelRow}>
                <label className={styles.label}>
                  <span className={styles.labelIcon} style={{ color: 'var(--accent-amber)' }}>●</span>
                  DESTINATION
                </label>
                {originCoords && (
                  <span className={styles.nearbyBadge}>⊙ FILTERED TO ORIGIN AREA</span>
                )}
              </div>
              <div className={styles.inputContainer}>
                <input className={styles.input} type="text" value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onFocus={() => setFocusField('dest')}
                  onBlur={() => setTimeout(() => setFocusField(null), 180)}
                  placeholder={originCoords ? 'Places near your origin…' : 'Bengaluru Airport, India Gate…'}
                  autoComplete="off" spellCheck="false" />
                {destFetching && <span className={styles.fieldLoader} />}
                {focusField === 'dest' && destSugg.length > 0 && (
                  <ul className={styles.suggestions}>
                    {destSugg.map(s => (
                      <li key={s.id} className={styles.suggestionItem} onMouseDown={() => pick('dest', s)}>
                        <span className={styles.sugDot} style={{ background: 'var(--accent-amber)' }} />
                        <span className={styles.sugBody}>
                          <span className={styles.sugName}>{s.name}</span>
                          {s.sub && <span className={styles.sugSub}>{s.sub}</span>}
                        </span>
                        {s.type && <span className={styles.sugType}>{s.type}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {error && <p className={styles.error}>⚠ {error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting
              ? <span className={styles.btnLoader} />
              : <><span>FIND ROUTES</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg></>
            }
          </button>
        </form>

        <div className={styles.statsBar}>
          <div className={styles.stat}><span className={styles.statNum}>PAN-INDIA</span><span className={styles.statLabel}>COVERAGE</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>LIVE GPS</span><span className={styles.statLabel}>CURRENT LOC</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>OSM</span><span className={styles.statLabel}>REAL SHOPS</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>OSRM</span><span className={styles.statLabel}>ROAD ROUTING</span></div>
        </div>
      </main>

      <div className={styles.cornerTL} />
      <div className={styles.cornerBR} />
    </div>
  )
}
