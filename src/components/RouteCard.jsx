import styles from './RouteCard.module.css'

const BADGE_ICONS = {
  'Fast': '⚡',
  'Recommended': '★',
  'Scenic': '◉',
  'Budget': '◎',
  'Direct': '→',
  'Efficient': '◈',
  'Alternate': '⟳',
}

const getSafetyColor = (score) => {
  if (score >= 80) return { color: 'var(--accent-green)', label: 'SAFE' }
  if (score >= 60) return { color: 'var(--accent-amber)', label: 'MODERATE' }
  return { color: 'var(--accent-red)', label: 'CAUTION' }
}

export default function RouteCard({ route, index, isSelected, onSelect }) {
  const safety = getSafetyColor(route.safetyScore)

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Left accent bar */}
      <div className={styles.accentBar} style={{ background: safety.color }} />

      {/* Main content */}
      <div className={styles.content}>
        {/* Top row */}
        <div className={styles.topRow}>
          <div className={styles.routeNameWrap}>
            <span className={styles.routeIndex}>0{index + 1}</span>
            <div>
              <h3 className={styles.routeName}>{route.name}</h3>
              <p className={styles.routeDesc}>{route.description}</p>
            </div>
          </div>

          <div className={styles.safetyBadge}>
            <div
              className={styles.safetyRing}
              style={{ '--safety-pct': `${route.safetyScore}%`, '--safety-color': safety.color }}
            >
              <svg className={styles.ringsvg} viewBox="0 0 36 36">
                <circle className={styles.ringBg} cx="18" cy="18" r="15" />
                <circle
                  className={styles.ringFill}
                  cx="18"
                  cy="18"
                  r="15"
                  style={{
                    stroke: safety.color,
                    strokeDasharray: `${(route.safetyScore / 100) * 94.2} 94.2`
                  }}
                />
              </svg>
              <div className={styles.ringInner}>
                <span className={styles.safetyNum} style={{ color: safety.color }}>
                  {route.safetyScore}%
                </span>
                <span className={styles.safetyLabel} style={{ color: safety.color }}>
                  {safety.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>◷</span>
            <span className={styles.statValue}>{route.duration}</span>
            <span className={styles.statLabel}>DURATION</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statIcon}>⊙</span>
            <span className={styles.statValue}>{route.distance}</span>
            <span className={styles.statLabel}>DISTANCE</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statIcon}>⊞</span>
            <span className={styles.statValue}>{route.transfers}</span>
            <span className={styles.statLabel}>TRANSFERS</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statIcon} style={{ color: 'var(--accent-amber)' }}>⬡</span>
            <span className={styles.statValue} style={{ color: 'var(--accent-amber)' }}>
              {route.totalShops}
            </span>
            <span className={styles.statLabel}>SHOPS / BRANDS</span>
          </div>
        </div>

        {/* Brands row */}
        {route.brands && route.brands.length > 0 && (
          <div className={styles.brandsRow}>
            <span className={styles.brandsLabel}>NEARBY BRANDS:</span>
            <div className={styles.brandTags}>
              {route.brands.slice(0, 5).map((brand, i) => (
                <span key={i} className={styles.brandTag}>{brand}</span>
              ))}
              {route.brands.length > 5 && (
                <span className={styles.brandMore}>+{route.brands.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {/* Badges + Select */}
        <div className={styles.bottomRow}>
          <div className={styles.badges}>
            {route.badges && route.badges.map((badge, i) => (
              <span key={i} className={`${styles.badge} ${badge === 'Recommended' ? styles.badgeFeatured : ''}`}>
                {BADGE_ICONS[badge] || '•'} {badge}
              </span>
            ))}
          </div>
          <div className={`${styles.selectIndicator} ${isSelected ? styles.selectIndicatorActive : ''}`}>
            {isSelected ? (
              <>
                <span className={styles.checkmark}>✓</span>
                SELECTED
              </>
            ) : (
              'SELECT'
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
