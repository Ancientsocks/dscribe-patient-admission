import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import BarChart from '../components/BarChart'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { ErrorState } from '../components/EmptyState'
import { SkeletonLine } from '../components/Skeleton'
import { IconActivity, IconBed, IconCheckCircle, IconRefresh, IconUsers } from '../components/icons'
import { fetchDashboardStats } from '../services/patients'
import { toApiError } from '../services/api'
import { formatDate, initials } from '../utils/format'

function RecentAdmissions({ items, loading }) {
  return (
    <section className="card" aria-label="Recent admissions">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recent admissions</h2>
          <p className="mt-0.5 text-xs text-slate-500">Latest patients added to the register</p>
        </div>
        <Link to="/patients" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
          View all →
        </Link>
      </div>

      {loading ? (
        <ul className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 px-5 py-3.5">
              <SkeletonLine className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonLine className="h-3 w-40" />
                <SkeletonLine className="h-3 w-24" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title="No admissions yet"
          description="Patients you admit will appear here with their ward and doctor."
          action={
            <Link to="/patients/new" className="btn-primary">
              Admit first patient
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((patient) => (
            <li key={patient.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {initials(patient.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{patient.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {patient.ward} · {patient.department} · {patient.doctor}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-600">{formatDate(patient.admission_date)}</p>
                <div className="mt-1 flex justify-end">
                  <StatusBadge status={patient.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (signal, { silent = false } = {}) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    setError(null)
    try {
      const data = await fetchDashboardStats(signal)
      setStats(data)
    } catch (caught) {
      if (!caught?.cancelled) setError(toApiError(caught).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const total = stats?.total_patients ?? 0
  const admitted = stats?.admitted_patients ?? 0
  const discharged = stats?.discharged_patients ?? 0
  const occupancy = total > 0 ? Math.round((admitted / total) * 100) : 0
  const activeWards = stats?.ward_distribution?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Hospital overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Live admission activity across wards, departments and doctors.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(undefined, { silent: true })}
          className="btn-secondary"
          disabled={refreshing}
        >
          <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && !stats ? (
        <div className="card">
          <ErrorState message={error} onRetry={() => load()} title="Dashboard unavailable" />
        </div>
      ) : (
        <>
          {error ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              <span>{error}</span>
              <button type="button" className="font-semibold underline" onClick={() => load()}>
                Retry
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total patients"
              value={total}
              hint="All admission records"
              icon={IconUsers}
              tone="brand"
              loading={loading}
            />
            <StatCard
              label="Currently admitted"
              value={admitted}
              hint={`${occupancy}% of all records`}
              icon={IconBed}
              tone="emerald"
              loading={loading}
            />
            <StatCard
              label="Discharged"
              value={discharged}
              hint="Completed admissions"
              icon={IconCheckCircle}
              tone="slate"
              loading={loading}
            />
            <StatCard
              label="Active wards"
              value={activeWards}
              hint="Wards with patients"
              icon={IconActivity}
              tone="amber"
              loading={loading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart
              title="Ward-wise distribution"
              subtitle="Admitted and discharged patients per ward"
              data={stats?.ward_distribution || []}
              loading={loading}
              emptyMessage="No ward activity recorded yet."
            />
            <BarChart
              title="Department-wise distribution"
              subtitle="Patient load per treating department"
              data={stats?.department_distribution || []}
              loading={loading}
              emptyMessage="No department activity recorded yet."
            />
          </div>

          <RecentAdmissions items={stats?.recent_admissions || []} loading={loading} />
        </>
      )}
    </div>
  )
}
