import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { rules, validateSignup, getPasswordStrength } from '../../utils/validation.js'
import styles from './auth.module.css'

const EyeOpen  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const EyeClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>

// Per-field validators (for live validation on blur/type)
const VALIDATORS = {
  name:     (v)        => rules.name(v),
  email:    (v)        => rules.email(v),
  password: (v)        => rules.password(v),
  confirm:  (v, form)  => rules.confirmPassword(v, form.password),
}

export default function SignupPage({ onSuccess, onSwitch }) {
  const { signup } = useAuth()

  const [form, setForm]           = useState({ name: '', email: '', password: '', confirm: '' })
  const [touched, setTouched]     = useState({})
  const [fieldErrs, setFieldErrs] = useState({})
  const [showPw, setShowPw]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [serverErr, setServerErr] = useState('')
  const [shake, setShake]         = useState(false)

  const strength = getPasswordStrength(form.password)

  const set = (k) => (e) => {
    const val = e.target.value
    const next = { ...form, [k]: val }
    setForm(next)
    setServerErr('')
    if (touched[k]) {
      const err = VALIDATORS[k](val, next)
      setFieldErrs(fe => ({ ...fe, [k]: err }))
      // If we just updated password, also re-validate confirm if touched
      if (k === 'password' && touched.confirm) {
        setFieldErrs(fe => ({ ...fe, confirm: rules.confirmPassword(next.confirm, val) }))
      }
    }
  }

  const onBlur = (k) => () => {
    setTouched(t => ({ ...t, [k]: true }))
    setFieldErrs(fe => ({ ...fe, [k]: VALIDATORS[k](form[k], form) }))
  }

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Touch all fields
    setTouched({ name: true, email: true, password: true, confirm: true })
    const errs = validateSignup(form)
    setFieldErrs(errs)
    if (Object.keys(errs).length > 0) { triggerShake(); return }

    setLoading(true); setServerErr('')
    try {
      await signup(form.name.trim(), form.email.trim().toLowerCase(), form.password)
      onSuccess()
    } catch (err) {
      setServerErr(err.response?.data?.error || 'Registration failed. Please try again.')
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
          <h1 className={styles.cardTitle}>Create account</h1>
          <p className={styles.cardSub}>Join GoSafe — navigate India smarter & safer</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {serverErr && <div className={styles.error}>⚠ {serverErr}</div>}

          {/* Full Name */}
          <div className={styles.field}>
            <label className={styles.label}>FULL NAME</label>
            <input className={cls('name')} type="text" value={form.name}
              onChange={set('name')} onBlur={onBlur('name')}
              placeholder="Priya Sharma" autoFocus autoComplete="name" />
            {touched.name && fieldErrs.name && <span className={styles.fieldError}>⚠ {fieldErrs.name}</span>}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label}>EMAIL ADDRESS</label>
            <input className={cls('email')} type="email" value={form.email}
              onChange={set('email')} onBlur={onBlur('email')}
              placeholder="you@example.com" autoComplete="email" />
            {touched.email && fieldErrs.email && <span className={styles.fieldError}>⚠ {fieldErrs.email}</span>}
          </div>

          {/* Password + strength meter */}
          <div className={styles.field}>
            <label className={styles.label}>PASSWORD</label>
            <div className={styles.inputWrap}>
              <input className={cls('password')} type={showPw ? 'text' : 'password'} value={form.password}
                onChange={set('password')} onBlur={onBlur('password')}
                placeholder="Min. 6 chars, 1 letter + 1 number" autoComplete="new-password" />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeClose /> : <EyeOpen />}
              </button>
            </div>
            {/* Strength meter — show as soon as user starts typing */}
            {form.password && (
              <div className={styles.strengthWrap}>
                <div className={styles.strengthBar}>
                  <div className={styles.strengthFill} style={{
                    width: `${strength.level * 25}%`,
                    background: strength.color
                  }} />
                </div>
                <span className={styles.strengthLabel} style={{ color: strength.color }}>
                  {strength.label} password
                </span>
              </div>
            )}
            {touched.password && fieldErrs.password && <span className={styles.fieldError}>⚠ {fieldErrs.password}</span>}
          </div>

          {/* Confirm password */}
          <div className={styles.field}>
            <label className={styles.label}>CONFIRM PASSWORD</label>
            <div className={styles.inputWrap}>
              <input className={cls('confirm')} type={showConfirm ? 'text' : 'password'} value={form.confirm}
                onChange={set('confirm')} onBlur={onBlur('confirm')}
                placeholder="••••••••" autoComplete="new-password" />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(s => !s)}>
                {showConfirm ? <EyeClose /> : <EyeOpen />}
              </button>
            </div>
            {touched.confirm && fieldErrs.confirm && <span className={styles.fieldError}>⚠ {fieldErrs.confirm}</span>}
            {touched.confirm && !fieldErrs.confirm && form.confirm && (
              <span className={styles.fieldError} style={{ color: 'var(--accent-green)' }}>✓ Passwords match</span>
            )}
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? <span className={styles.loader} /> : 'CREATE ACCOUNT →'}
          </button>
          <div className={styles.divider}>OR</div>
          <p className={styles.switchRow}>
            Already have an account?{' '}
            <button type="button" className={styles.switchLink} onClick={onSwitch}>Sign in</button>
          </p>
        </form>
      </div>
    </div>
  )
}
