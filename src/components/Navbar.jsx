import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Navbar.module.css'

export default function Navbar({ currentPage, onNavigate, onHome }) {
  const { user, logout, isLoggedIn } = useAuth()
  const API_BASE = 'http://localhost:3001'
  const avatarSrc = (url) => !url ? null : url.startsWith('http') ? url : `${API_BASE}${url}`
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); onHome(); setMenuOpen(false) }

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <button className={styles.logo} onClick={onHome}>
        <img src="logo_png.png" alt="GoSafe" className={styles.logoImg} />
        <span className={styles.logoText}>GOSAFE</span>
      </button>

      {/* Center nav links */}
      <div className={styles.center}>
        <button className={`${styles.navLink} ${currentPage==='search'?styles.active:''}`} onClick={onHome}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>SEARCH</span>
        </button>
        {isLoggedIn && (
          <button className={`${styles.navLink} ${currentPage==='profile'?styles.active:''}`} onClick={() => onNavigate('profile')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            <span>MY ROUTES</span>
          </button>
        )}
      </div>

      {/* Right — auth controls */}
      <div className={styles.right}>
        {isLoggedIn ? (
          <div className={styles.userMenu}>
            <button className={styles.avatarBtn} onClick={() => setMenuOpen(!menuOpen)}>
              {user.avatar_url
                ? <img src={avatarSrc(user.avatar_url)} alt={user.name} className={styles.avatarImg} />
                : <span className={styles.avatarInitial}>{user.name[0].toUpperCase()}</span>
              }
              <span className={styles.userName}>{user.name.split(' ')[0]}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{transform: menuOpen?'rotate(180deg)':'none', transition:'0.2s'}}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownName}>{user.name}</span>
                  <span className={styles.dropdownEmail}>{user.email}</span>
                </div>
                <button className={styles.dropdownItem} onClick={() => { onNavigate('profile'); setMenuOpen(false) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Edit Profile
                </button>
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.authBtns}>
            <button className={styles.loginBtn} onClick={() => onNavigate('login')}>SIGN IN</button>
            <button className={styles.signupBtn} onClick={() => onNavigate('signup')}>GET STARTED</button>
          </div>
        )}
      </div>
    </nav>
  )
}
