const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconDashboard(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="11" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="18" width="7" height="3" rx="1.5" />
    </svg>
  )
}

export function IconUsers(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 19v-1.5a4 4 0 0 0-3-3.87M16.5 4.2a3.2 3.2 0 0 1 0 5.6" />
    </svg>
  )
}

export function IconUserPlus(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M15 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
      <circle cx="8.5" cy="7" r="3.2" />
      <path d="M19 8v6M16 11h6" />
    </svg>
  )
}

export function IconSearch(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  )
}

export function IconPlus(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconClose(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function IconMenu(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function IconEdit(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function IconTrash(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconCheckCircle(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  )
}

export function IconArrowLeft(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}

export function IconChevronLeft(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function IconChevronRight(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function IconCalendar(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </svg>
  )
}

export function IconStethoscope(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M5 3v5a4 4 0 0 0 8 0V3" />
      <path d="M5 3H3M13 3h2M9 12v3a5 5 0 0 0 10 0v-2" />
      <circle cx="19" cy="10" r="2" />
    </svg>
  )
}

export function IconBed(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M3 18V8M3 12h18a2 2 0 0 1 2 2v4" />
      <path d="M3 18h20M8 12V9h4v3" />
    </svg>
  )
}

export function IconActivity(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M3 12h4l2.5-7 4 14L16 12h5" />
    </svg>
  )
}

export function IconAlert(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 3.5 2.8 19h18.4L12 3.5Z" />
      <path d="M12 9.5V14M12 17h.01" />
    </svg>
  )
}

export function IconRefresh(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 6.3" />
      <path d="M20 5v6h-6" />
    </svg>
  )
}

export function IconFilter(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M4 5h16l-6 7.5V20l-4-2v-5.5L4 5Z" />
    </svg>
  )
}
