import { IconChevronLeft, IconChevronRight } from './icons'

function pageNumbers(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1])
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}) {
  const pages = pageNumbers(page, Math.max(totalPages, 1))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>
          Showing <span className="font-semibold text-slate-700">{from}</span>–
          <span className="font-semibold text-slate-700">{to}</span> of{' '}
          <span className="font-semibold text-slate-700">{total}</span> patients
        </span>
        <label className="flex items-center gap-1.5">
          <span className="sr-only sm:not-sr-only">Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            disabled={disabled}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            aria-label="Rows per page"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="btn-ghost px-2.5"
          aria-label="Previous page"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((number, index) => {
          const previous = pages[index - 1]
          const showGap = previous && number - previous > 1
          return (
            <span key={number} className="flex items-center gap-1">
              {showGap ? <span className="px-1 text-xs text-slate-400">…</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(number)}
                disabled={disabled}
                aria-current={number === page ? 'page' : undefined}
                className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  number === page
                    ? 'bg-brand-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100 disabled:opacity-50'
                }`}
              >
                {number}
              </button>
            </span>
          )
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="btn-ghost px-2.5"
          aria-label="Next page"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
