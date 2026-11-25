const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(value) {
  if (!value) return '—'
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return '—'
  return DATE_FORMATTER.format(parsed)
}

export function formatDateTime(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return `${DATE_FORMATTER.format(parsed)}, ${parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function todayLong() {
  return LONG_DATE_FORMATTER.format(new Date())
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function daysSince(value) {
  if (!value) return null
  const admitted = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(admitted.getTime())) return null
  const diff = Math.floor((Date.now() - admitted.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 0)
}

export function getPageTitle(pathname) {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/patients') return 'Patients'
  if (pathname === '/patients/new') return 'Add patient'
  if (/^\/patients\/\d+\/edit$/.test(pathname)) return 'Edit patient'
  return 'Page not found'
}
