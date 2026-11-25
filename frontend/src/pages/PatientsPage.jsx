import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { ErrorState } from '../components/EmptyState'
import Pagination from '../components/Pagination'
import PatientTable from '../components/PatientTable'
import useDebounce from '../hooks/useDebounce'
import { useOptions } from '../hooks/useOptions'
import { useToast } from '../hooks/useToast'
import { deletePatient, dischargePatient, fetchPatients } from '../services/patients'
import { toApiError } from '../services/api'
import { IconFilter, IconPlus, IconSearch, IconUsers, IconClose } from '../components/icons'

const EMPTY_FILTERS = { ward: '', department: '', doctor: '', status: '' }

export default function PatientsPage() {
  const { options } = useOptions()
  const { notify } = useToast()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 350)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [pending, setPending] = useState(null) // { type: 'delete' | 'discharge', patient }
  const [actionLoading, setActionLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const hasFilters = Boolean(
    searchInput.trim() || filters.ward || filters.department || filters.doctor || filters.status,
  )

  useEffect(() => {
    setPage(1)
  }, [search, filters.ward, filters.department, filters.doctor, filters.status])

  const query = useMemo(() => {
    const params = { page, page_size: pageSize }
    if (search.trim()) params.search = search.trim()
    if (filters.ward) params.ward = filters.ward
    if (filters.department) params.department = filters.department
    if (filters.doctor) params.doctor = filters.doctor
    if (filters.status) params.status = filters.status
    return params
  }, [page, pageSize, search, filters])

  const load = useCallback(
    async (signal) => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchPatients(query, signal)
        setData(response)
      } catch (caught) {
        if (!caught?.cancelled) setError(toApiError(caught).message)
      } finally {
        setLoading(false)
      }
    },
    [query],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load, refreshKey])

  const clearFilters = () => {
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const closeDialog = () => {
    if (actionLoading) return
    setPending(null)
  }

  const handleConfirm = async () => {
    if (!pending) return
    const { type, patient } = pending
    setActionLoading(true)
    setBusyId(patient.id)
    try {
      if (type === 'delete') {
        await deletePatient(patient.id)
        notify({
          type: 'success',
          title: 'Patient deleted',
          description: `${patient.name} was removed from the admission register.`,
        })
        setPending(null)
        if (data?.items?.length === 1 && page > 1) setPage(page - 1)
        else setRefreshKey((key) => key + 1)
      } else {
        await dischargePatient(patient.id)
        notify({
          type: 'success',
          title: 'Patient discharged',
          description: `${patient.name} is now marked as discharged. Admission date preserved.`,
        })
        setPending(null)
        setRefreshKey((key) => key + 1)
      }
    } catch (caught) {
      const apiError = toApiError(caught)
      notify({ type: 'error', title: 'Action failed', description: apiError.message })
      setPending(null)
      setRefreshKey((key) => key + 1)
    } finally {
      setActionLoading(false)
      setBusyId(null)
    }
  }

  const patients = data?.items || []
  const showFullEmpty = !loading && !error && patients.length === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Patient register</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter and manage every admission across the hospital.
          </p>
        </div>
        <Link to="/patients/new" className="btn-primary">
          <IconPlus className="h-4 w-4" />
          Add patient
        </Link>
      </div>

      <section className="card p-4 sm:p-5" aria-label="Search and filters">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <label className="field-label" htmlFor="patient-search">
              Search by name
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                id="patient-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Type a patient name…"
                className="field-input pl-9 pr-9"
                autoComplete="off"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {[
            { key: 'ward', label: 'Ward', list: options?.wards || [] },
            { key: 'department', label: 'Department', list: options?.departments || [] },
            { key: 'doctor', label: 'Doctor', list: options?.doctors || [] },
          ].map(({ key, label, list }) => (
            <div key={key}>
              <label className="field-label" htmlFor={`filter-${key}`}>
                {label}
              </label>
              <select
                id={`filter-${key}`}
                value={filters[key]}
                onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
                className="field-input"
              >
                <option value="">All {label.toLowerCase()}s</option>
                {list.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <IconFilter className="h-3.5 w-3.5" />
              Status
            </span>
            {['', 'Admitted', 'Discharged'].map((value) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, status: value }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filters.status === value
                    ? 'bg-brand-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-pressed={filters.status === value}
              >
                {value || 'All'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!loading && data ? (
              <span className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{data.total}</span> matching patient(s)
              </span>
            ) : null}
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Clear all filters
            </button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden" aria-label="Patients">
        {error ? (
          <ErrorState
            message={error}
            title="Could not load patients"
            onRetry={() => setRefreshKey((key) => key + 1)}
          />
        ) : showFullEmpty ? (
          hasFilters ? (
            <EmptyState
              icon={IconSearch}
              title="No patients match these filters"
              description="Try a different name, ward, department or doctor — or clear the filters to see everyone."
              action={
                <button type="button" className="btn-secondary" onClick={clearFilters}>
                  Clear all filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={IconUsers}
              title="No patients admitted yet"
              description="Admit your first patient to start building the hospital register."
              action={
                <Link to="/patients/new" className="btn-primary">
                  <IconPlus className="h-4 w-4" />
                  Add patient
                </Link>
              }
            />
          )
        ) : (
          <>
            <PatientTable
              patients={patients}
              loading={loading}
              busyId={busyId}
              onDelete={(patient) => setPending({ type: 'delete', patient })}
              onDischarge={(patient) => setPending({ type: 'discharge', patient })}
            />
            {data && data.total > 0 ? (
              <Pagination
                page={data.page}
                totalPages={data.total_pages}
                total={data.total}
                pageSize={data.page_size}
                onPageChange={(next) => setPage(next)}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
                disabled={loading}
              />
            ) : null}
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.type === 'delete' ? 'Delete patient record?' : 'Discharge patient?'}
        description={
          pending?.type === 'delete'
            ? `${pending?.patient?.name}'s admission record will be permanently removed. This action cannot be undone.`
            : `${pending?.patient?.name} will be marked as Discharged. The original admission date is preserved and the record stays in the register.`
        }
        confirmLabel={pending?.type === 'delete' ? 'Delete patient' : 'Confirm discharge'}
        tone={pending?.type === 'delete' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </div>
  )
}
