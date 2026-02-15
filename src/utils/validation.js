// ── Rules ─────────────────────────────────────────────────────────────────────
export const rules = {
  name: (v) => {
    if (!v.trim()) return 'Full name is required.'
    if (v.trim().length < 2) return 'Name must be at least 2 characters.'
    if (v.trim().length > 80) return 'Name must be under 80 characters.'
    if (!/^[a-zA-Z\u00C0-\u024F\s'-]+$/.test(v.trim()))
      return 'Name can only contain letters, spaces, hyphens and apostrophes.'
    return ''
  },

  email: (v) => {
    if (!v.trim()) return 'Email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
      return 'Enter a valid email address (e.g. you@gmail.com).'
    return ''
  },

  password: (v) => {
    if (!v) return 'Password is required.'
    if (v.length < 6) return 'Password must be at least 6 characters.'
    if (v.length > 128) return 'Password is too long.'
    if (!/[A-Za-z]/.test(v)) return 'Password must contain at least one letter.'
    if (!/[0-9]/.test(v)) return 'Password must contain at least one number.'
    return ''
  },

  confirmPassword: (v, pw) => {
    if (!v) return 'Please confirm your password.'
    if (v !== pw) return 'Passwords do not match.'
    return ''
  },
}

// ── Password strength ─────────────────────────────────────────────────────────
export const getPasswordStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8)          score++
  if (pw.length >= 12)         score++
  if (/[A-Z]/.test(pw))        score++
  if (/[a-z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return { level: 1, label: 'Weak',   color: 'var(--accent-red)' }
  if (score <= 4) return { level: 2, label: 'Fair',   color: 'var(--accent-amber)' }
  if (score <= 5) return { level: 3, label: 'Good',   color: '#7fc67f' }
  return              { level: 4, label: 'Strong', color: 'var(--accent-green)' }
}

// ── Validate entire form, return {field: errorMsg} ───────────────────────────
export const validateSignup = (form) => {
  const errs = {}
  const nameErr = rules.name(form.name)
  const emailErr = rules.email(form.email)
  const pwErr = rules.password(form.password)
  const confirmErr = rules.confirmPassword(form.confirm, form.password)
  if (nameErr)    errs.name    = nameErr
  if (emailErr)   errs.email   = emailErr
  if (pwErr)      errs.password = pwErr
  if (confirmErr) errs.confirm  = confirmErr
  return errs
}

export const validateLogin = (form) => {
  const errs = {}
  const emailErr = rules.email(form.email)
  if (emailErr)       errs.email    = emailErr
  if (!form.password) errs.password = 'Password is required.'
  return errs
}
