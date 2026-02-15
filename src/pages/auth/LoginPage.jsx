import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { rules, validateLogin } from '../../utils/validation.js'
import styles from './auth.module.css'

const EyeOpen  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const EyeClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>

export default function LoginPage({ onSuccess, onSwitch }) {
  const { login } = useAuth()

  const [form, setForm]           = useState({ email: '', password: '' })
  const [touched, setTouched]     = useState({})
  const [fieldErrs, setFieldErrs] = useState({})
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [serverErr, setServerErr] = useState('')
  const [shake, setShake]         = useState(false)

  const set = (k) => (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, [k]: val }))
    setServerErr('')
    if (touched[k]) {
      const err = k === 'email' ? rules.email(val) : (val ? '' : 'Password is required.')
      setFieldErrs(fe => ({ ...fe, [k]: err }))
    }
  }

  const onBlur = (k) => () => {
    setTouched(t => ({ ...t, [k]: true }))
    const err = k === 'email' ? rules.email(form[k]) : (form[k] ? '' : 'Password is required.')
    setFieldErrs(fe => ({ ...fe, [k]: err }))
  }

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const errs = validateLogin(form)
    setFieldErrs(errs)
    if (Object.keys(errs).length > 0) { triggerShake(); return }
    setLoading(true); setServerErr('')
    try {
      await login(form.email.trim().toLowerCase(), form.password)
      onSuccess()
    } catch (err) {
      setServerErr(err.response?.data?.error || 'Login failed. Please try again.')
      triggerShake()
    } finally { setLoading(false) }
  }

  const cls = (k) => {
    if (!touched[k]) return styles.input
    return `${styles.input} ${fieldErrs[k] ? styles.inputError : (form[k] ? styles.inputValid : '')}`
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${shake ? styles.shake : ''}`}>
        <div className={styles.cardHead}>
          <h1 className={styles.cardTitle}>Welcome back</h1>
          <p className={styles.cardSub}>Sign in to your GoSafe account</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {serverErr && <div className={styles.error}>⚠ {serverErr}</div>}

          <div className={styles.field}>
            <label className={styles.label}>EMAIL ADDRESS</label>
            <input className={cls('email')} type="email" value={form.email}
              onChange={set('email')} onBlur={onBlur('email')}
              placeholder="you@example.com" autoFocus autoComplete="email" />
            {touched.email && fieldErrs.email && <span className={styles.fieldError}>⚠ {fieldErrs.email}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>PASSWORD</label>
            <div className={styles.inputWrap}>
              <input className={cls('password')} type={showPw ? 'text' : 'password'} value={form.password}
                onChange={set('password')} onBlur={onBlur('password')}
                placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeClose /> : <EyeOpen />}
              </button>
            </div>
            {touched.password && fieldErrs.password && <span className={styles.fieldError}>⚠ {fieldErrs.password}</span>}
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? <span className={styles.loader} /> : 'SIGN IN →'}
          </button>
          <div className={styles.divider}>OR</div>
          <p className={styles.switchRow}>
            Don't have an account?{' '}
            <button type="button" className={styles.switchLink} onClick={onSwitch}>Create one</button>
          </p>
        </form>
      </div>
    </div>
  )
}
