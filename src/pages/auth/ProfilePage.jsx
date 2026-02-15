import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './ProfilePage.module.css'

const TABS = ['PROFILE', 'CONTACTS', 'HISTORY', 'SAVED']

export default function ProfilePage({ onNavigate }) {
  const { user, updateProfile, changePassword, getHistory, getSavedRoutes, deleteSavedRoute, getContacts, addContact, deleteContact, logout } = useAuth()
  const [tab, setTab]         = useState('PROFILE')
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ name: user?.name||'', city: user?.city||'', phone: user?.phone||'' })
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' })
  const [history, setHistory] = useState([])
  const [saved, setSaved]     = useState([])
  const [contacts, setContacts] = useState([])
  const [contactForm, setContactForm] = useState({ name: '', phone: '', relation: '' })
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [err, setErr]         = useState('')
  const fileRef               = useRef()
  const [previewUrl, setPreviewUrl] = useState(null)

  const API_BASE = 'http://localhost:3001'
  const avatarSrc = (url) => !url ? null : url.startsWith('http') ? url : `${API_BASE}${url}`

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  useEffect(() => {
    if (tab === 'HISTORY')  getHistory().then(setHistory).catch(()=>{})
    if (tab === 'SAVED')    getSavedRoutes().then(setSaved).catch(()=>{})
    if (tab === 'CONTACTS') getContacts().then(setContacts).catch(()=>{})
  }, [tab])

  const handleProfileSave = async (e) => {
    e.preventDefault(); setSaving(true); setErr(''); setMsg('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('city', form.city)
      fd.append('phone', form.phone)
      if (fileRef.current?.files[0]) fd.append('avatar', fileRef.current.files[0])
      await updateProfile(fd)
      setMsg('Profile updated successfully.'); setEditing(false)
    } catch (e) { setErr(e.response?.data?.error || 'Update failed.') }
    finally { setSaving(false) }
  }

  const handlePwChange = async (e) => {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { setErr('New passwords do not match.'); return }
    setSaving(true); setErr(''); setMsg('')
    try {
      await changePassword(pwForm.current, pwForm.next)
      setMsg('Password changed successfully.'); setPwForm({current:'',next:'',confirm:''})
    } catch(e) { setErr(e.response?.data?.error || 'Change failed.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await deleteSavedRoute(id)
    setSaved(s => s.filter(r => r.id !== id))
  }

  if (!user) return (
    <div className={styles.notAuth}>
      <p>You need to be signed in to view your profile.</p>
      <button onClick={() => onNavigate('login')} className={styles.ctaBtn}>SIGN IN</button>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.avatarBlock}>
          {(previewUrl || user.avatar_url)
            ? <img src={previewUrl || avatarSrc(user.avatar_url)} alt={user.name} className={styles.avatar} />
            : <div className={styles.avatarFallback}>{user.name[0].toUpperCase()}</div>
          }
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userEmail}>{user.email}</span>
            {user.city && <span className={styles.userCity}>📍 {user.city}</span>}
          </div>
        </div>
        <div className={styles.sideStats}>
          <div className={styles.sideStat}><span className={styles.sideStatNum}>{history.length||'—'}</span><span className={styles.sideStatLbl}>ROUTES</span></div>
          <div className={styles.sideStatDiv}/>
          <div className={styles.sideStat}><span className={styles.sideStatNum}>{saved.length||'—'}</span><span className={styles.sideStatLbl}>SAVED</span></div>
        </div>
        <nav className={styles.sideNav}>
          {TABS.map(t => (
            <button key={t} className={`${styles.sideNavBtn} ${tab===t?styles.sideNavActive:''}`} onClick={()=>{setTab(t);setMsg('');setErr('')}}>
              {t === 'PROFILE' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              {t === 'HISTORY' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              {t === 'CONTACTS' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.41 2 2 0 0 1 3.54 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
              {t === 'SAVED'   && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}
              {t}
            </button>
          ))}
          <div className={styles.sideNavDiv}/>
          <button className={`${styles.sideNavBtn} ${styles.logoutBtn}`} onClick={() => { logout(); onNavigate('search') }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            SIGN OUT
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {msg && <div className={styles.success}>✓ {msg}</div>}
        {err && <div className={styles.error}>⚠ {err}</div>}

        {/* ── PROFILE TAB ── */}
        {tab === 'PROFILE' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>EDIT PROFILE</h2>
              {!editing && <button className={styles.editBtn} onClick={() => setEditing(true)}>EDIT</button>}
            </div>
            <form className={styles.form} onSubmit={handleProfileSave}>
              <div className={styles.avatarUploadRow}>
                {(previewUrl || user.avatar_url)
                  ? <img src={previewUrl || avatarSrc(user.avatar_url)} alt="" className={styles.previewAvatar} />
                  : <div className={styles.previewFallback}>{user.name[0].toUpperCase()}</div>
                }
                {editing && (
                  <div className={styles.uploadInfo}>
                    <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                      CHANGE PHOTO
                    </button>
                    <span className={styles.uploadHint}>JPG, PNG up to 3MB</span>
                    <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
                  </div>
                )}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>FULL NAME</label>
                  <input className={styles.input} value={form.name}
                    onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                    disabled={!editing} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>EMAIL (CANNOT CHANGE)</label>
                  <input className={styles.input} value={user.email} disabled style={{opacity:0.5}} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>CITY</label>
                  <input className={styles.input} value={form.city}
                    onChange={e=>setForm(f=>({...f,city:e.target.value}))}
                    disabled={!editing} placeholder="Mumbai, Delhi…" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>PHONE</label>
                  <input className={styles.input} value={form.phone}
                    onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                    disabled={!editing} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>

              {editing && (
                <div className={styles.formBtns}>
                  <button type="button" className={styles.cancelBtn} onClick={()=>setEditing(false)}>CANCEL</button>
                  <button type="submit" className={styles.saveBtn} disabled={saving}>
                    {saving ? <span className={styles.loader}/> : 'SAVE CHANGES'}
                  </button>
                </div>
              )}
            </form>

            {/* Password section */}
            <div className={styles.sectionHead} style={{marginTop:32}}>
              <h2 className={styles.sectionTitle}>CHANGE PASSWORD</h2>
            </div>
            <form className={styles.form} onSubmit={handlePwChange}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>CURRENT PASSWORD</label>
                  <input className={styles.input} type="password" value={pwForm.current}
                    onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} placeholder="••••••••" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>NEW PASSWORD</label>
                  <input className={styles.input} type="password" value={pwForm.next}
                    onChange={e=>setPwForm(f=>({...f,next:e.target.value}))} placeholder="Min. 6 chars" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>CONFIRM NEW PASSWORD</label>
                  <input className={styles.input} type="password" value={pwForm.confirm}
                    onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} placeholder="••••••••" />
                </div>
              </div>
              <div className={styles.formBtns}>
                <button type="submit" className={styles.saveBtn} disabled={saving || !pwForm.current || !pwForm.next}>
                  {saving ? <span className={styles.loader}/> : 'UPDATE PASSWORD'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'HISTORY' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><h2 className={styles.sectionTitle}>SEARCH HISTORY</h2></div>
            {history.length === 0
              ? <p className={styles.empty}>No routes searched yet. Start exploring!</p>
              : <div className={styles.list}>
                  {history.map(h => (
                    <div key={h.id} className={styles.historyItem}>
                      <div className={styles.historyRoute}>
                        <span className={styles.historyFrom}>{h.origin}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        <span className={styles.historyTo}>{h.destination}</span>
                      </div>
                      <div className={styles.historyMeta}>
                        <span className={styles.historyBadge}>{h.route_name}</span>
                        {h.duration && <span className={styles.historyDetail}>⏱ {h.duration}</span>}
                        {h.distance && <span className={styles.historyDetail}>⊙ {h.distance}</span>}
                        {h.safety_score && <span className={styles.historyDetail} style={{color:'var(--accent-green)'}}>✓ {h.safety_score}% safe</span>}
                        <span className={styles.historyDate}>{new Date(h.searched_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}


        {/* ── CONTACTS TAB ── */}
        {tab === 'CONTACTS' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>EMERGENCY CONTACTS</h2>
              <span className={styles.contactCount}>{contacts.length}/5</span>
            </div>
            <p className={styles.contactHint}>
              🆘 These contacts will receive a WhatsApp SOS with your live location when you press the SOS button on the map.
            </p>

            {/* Add contact form */}
            {contacts.length < 5 && (
              <form className={styles.contactForm} onSubmit={async (e) => {
                e.preventDefault(); setErr(''); setSaving(true)
                try {
                  const contact = await addContact(contactForm)
                  setContacts(c => [...c, contact])
                  setContactForm({ name: '', phone: '', relation: '' })
                  setMsg('Contact added.')
                } catch(e) { setErr(e.response?.data?.error || 'Failed to add contact.') }
                finally { setSaving(false) }
              }}>
                <div className={styles.contactFormGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>FULL NAME *</label>
                    <input className={styles.input} value={contactForm.name} required
                      onChange={e => setContactForm(f=>({...f,name:e.target.value}))}
                      placeholder="Rahul Sharma" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>WHATSAPP NUMBER * (with country code)</label>
                    <input className={styles.input} value={contactForm.phone} required
                      onChange={e => setContactForm(f=>({...f,phone:e.target.value}))}
                      placeholder="+91 98765 43210" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>RELATION</label>
                    <input className={styles.input} value={contactForm.relation}
                      onChange={e => setContactForm(f=>({...f,relation:e.target.value}))}
                      placeholder="Mother, Friend, Brother…" />
                  </div>
                </div>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? <span className={styles.loader}/> : '+ ADD CONTACT'}
                </button>
              </form>
            )}

            {/* Contact list */}
            {contacts.length === 0
              ? <p className={styles.empty}>No emergency contacts yet. Add one above.</p>
              : <div className={styles.contactList}>
                  {contacts.map(c => (
                    <div key={c.id} className={styles.contactItem}>
                      <div className={styles.contactAvatar}>{c.name[0].toUpperCase()}</div>
                      <div className={styles.contactInfo}>
                        <span className={styles.contactName}>{c.name}</span>
                        <span className={styles.contactPhone}>{c.phone}</span>
                        {c.relation && <span className={styles.contactRelation}>{c.relation}</span>}
                      </div>
                      <button className={styles.deleteBtn} onClick={async () => {
                        await deleteContact(c.id)
                        setContacts(cs => cs.filter(x => x.id !== c.id))
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
        {/* ── SAVED TAB ── */}
        {tab === 'SAVED' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><h2 className={styles.sectionTitle}>SAVED ROUTES</h2></div>
            {saved.length === 0
              ? <p className={styles.empty}>No saved routes yet. Search and save your favourites!</p>
              : <div className={styles.list}>
                  {saved.map(r => (
                    <div key={r.id} className={styles.savedItem}>
                      <div className={styles.savedLabel}>{r.label || r.route_name}</div>
                      <div className={styles.savedRoute}>
                        <span>{r.origin}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        <span>{r.destination}</span>
                      </div>
                      <div className={styles.savedMeta}>
                        <span className={styles.historyDate}>{new Date(r.saved_at).toLocaleDateString('en-IN')}</span>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(r.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </main>
    </div>
  )
}
