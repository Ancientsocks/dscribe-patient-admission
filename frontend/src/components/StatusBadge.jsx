export default function StatusBadge({ status }) {
  const discharged = status === 'Discharged'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        discharged ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${discharged ? 'bg-slate-400' : 'bg-emerald-500'}`}
        aria-hidden="true"
      />
      {status || '—'}
    </span>
  )
}
