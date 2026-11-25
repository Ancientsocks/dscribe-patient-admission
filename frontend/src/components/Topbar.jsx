import { IconCalendar, IconMenu } from './icons'
import { todayLong } from '../utils/format'

export default function Topbar({ title, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-brand-700">DScribe · Patient Admission Management</p>
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h1>
      </div>

      <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
        <IconCalendar className="h-4 w-4 text-brand-600" />
        <span className="whitespace-nowrap">{todayLong()}</span>
      </div>

      <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
          AD
        </span>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-semibold text-slate-800">Admission Desk</p>
          <p className="text-[11px] text-slate-500">Front desk staff</p>
        </div>
      </div>
    </header>
  )
}
