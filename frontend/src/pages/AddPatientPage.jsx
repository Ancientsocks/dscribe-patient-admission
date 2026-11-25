import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import PatientForm from '../components/PatientForm'
import { ErrorState } from '../components/EmptyState'
import { FormSkeleton } from '../components/Skeleton'
import { IconArrowLeft } from '../components/icons'
import { useOptions } from '../hooks/useOptions'
import { useToast } from '../hooks/useToast'
import { createPatient } from '../services/patients'
import { toApiError } from '../services/api'
import { toPayload } from '../utils/validation'

export default function AddPatientPage() {
  const navigate = useNavigate()
  const { options, loading: optionsLoading, error: optionsError, reload } = useOptions()
  const { notify } = useToast()

  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const handleSubmit = async (values) => {
    if (submitting) return // guard against duplicate submissions
    setSubmitting(true)
    setServerErrors({})
    setFormError(null)
    try {
      const created = await createPatient(toPayload({ ...values, status: 'Admitted' }))
      notify({
        type: 'success',
        title: 'Patient admitted',
        description: `${created.name} was added to ${created.ward} under ${created.doctor}.`,
      })
      navigate('/patients')
    } catch (caught) {
      const apiError = toApiError(caught)
      setServerErrors(apiError.fieldErrors || {})
      setFormError(apiError.message)
      notify({ type: 'error', title: 'Could not admit patient', description: apiError.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link to="/patients" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800">
          <IconArrowLeft className="h-3.5 w-3.5" />
          Back to patients
        </Link>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Admit a new patient</h2>
        <p className="mt-1 text-sm text-slate-500">
          Capture the admission details. All fields are validated before the record is saved.
        </p>
      </div>

      {optionsError ? (
        <div className="card">
          <ErrorState message={optionsError} onRetry={reload} title="Could not load hospital options" />
        </div>
      ) : optionsLoading ? (
        <FormSkeleton />
      ) : (
        <>
          {formError ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}
          <PatientForm
            mode="create"
            options={options}
            submitting={submitting}
            serverErrors={serverErrors}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/patients')}
          />
        </>
      )}
    </div>
  )
}
