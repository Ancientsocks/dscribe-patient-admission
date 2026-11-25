import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import PatientForm from '../components/PatientForm'
import StatusBadge from '../components/StatusBadge'
import { ErrorState } from '../components/EmptyState'
import { FormSkeleton } from '../components/Skeleton'
import { IconArrowLeft } from '../components/icons'
import { useOptions } from '../hooks/useOptions'
import { useToast } from '../hooks/useToast'
import { fetchPatient, updatePatient } from '../services/patients'
import { toApiError } from '../services/api'
import { formatDate } from '../utils/format'
import { toPayload } from '../utils/validation'

export default function EditPatientPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { options, loading: optionsLoading, error: optionsError, reload } = useOptions()

  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const load = useCallback(
    async (signal) => {
      setLoading(true)
      setLoadError(null)
      setNotFound(false)
      try {
        const data = await fetchPatient(id, signal)
        setPatient(data)
      } catch (caught) {
        if (caught?.cancelled) return
        const apiError = toApiError(caught)
        if (apiError.status === 404) setNotFound(true)
        else setLoadError(apiError.message)
      } finally {
        setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const handleSubmit = async (values) => {
    if (submitting || !patient) return
    setSubmitting(true)
    setServerErrors({})
    setFormError(null)
    try {
      const updated = await updatePatient(patient.id, toPayload(values))
      notify({
        type: 'success',
        title: 'Patient updated',
        description: `${updated.name}'s admission details were saved.`,
      })
      navigate('/patients')
    } catch (caught) {
      const apiError = toApiError(caught)
      setServerErrors(apiError.fieldErrors || {})
      setFormError(apiError.message)
      notify({ type: 'error', title: 'Update failed', description: apiError.message })
    } finally {
      setSubmitting(false)
    }
  }

  const initialValues = patient
    ? {
        name: patient.name,
        age: String(patient.age),
        gender: patient.gender,
        ward: patient.ward,
        department: patient.department,
        doctor: patient.doctor,
        admission_date: patient.admission_date,
      }
    : null

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link to="/patients" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800">
          <IconArrowLeft className="h-3.5 w-3.5" />
          Back to patients
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {patient ? `Edit ${patient.name}` : 'Edit patient'}
          </h2>
          {patient ? <StatusBadge status={patient.status} /> : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {patient
            ? `Admitted on ${formatDate(patient.admission_date)} · Record #${patient.id}`
            : 'Update the admission details below.'}
        </p>
      </div>

      {loading ? (
        <FormSkeleton />
      ) : notFound ? (
        <div className="card">
          <ErrorState
            title="Patient not found"
            message="This admission record no longer exists. It may have been deleted."
            onRetry={() => navigate('/patients')}
          />
        </div>
      ) : loadError ? (
        <div className="card">
          <ErrorState message={loadError} onRetry={() => load()} title="Could not load patient" />
        </div>
      ) : optionsError ? (
        <div className="card">
          <ErrorState message={optionsError} onRetry={reload} title="Could not load hospital options" />
        </div>
      ) : optionsLoading || !initialValues ? (
        <FormSkeleton />
      ) : (
        <>
          {formError ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}
          <PatientForm
            mode="edit"
            options={options}
            initialValues={initialValues}
            submitting={submitting}
            serverErrors={serverErrors}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/patients')}
          />
          <p className="text-xs text-slate-500">
            To change the admission status, use the discharge action on the patients list — discharged
            records keep their original admission date.
          </p>
        </>
      )}
    </div>
  )
}
