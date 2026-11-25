const BAR_COLORS = ['bg-brand-600', 'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-400', 'bg-slate-400']

export default function BarChart({ title, subtitle, data = [], loading = false, emptyMessage = 'No data yet' }) {
  const max = data.reduce((highest, item) => Math.max(highest, item.count), 0)
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="card p-5" aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {!loading && total > 0 ? (
          <span className="chip">{total} total</span>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-4" aria-hidden="true">
          {[70, 50, 85, 40].map((width, index) => (
            <div key={index} className="space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 animate-pulse rounded-full bg-slate-100" style={{ width: `${width}%` }} />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3.5">
          {data.map((item, index) => {
            const percentage = max > 0 ? Math.round((item.count / max) * 100) : 0
            return (
              <li key={item.name}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-700">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {item.count}
                    <span className="ml-1 text-xs text-slate-400">
                      ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                    style={{ width: `${Math.max(percentage, item.count > 0 ? 6 : 0)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
