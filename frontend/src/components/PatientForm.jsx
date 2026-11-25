import { useMemo, useState } from 'react'

import { todayISO, validatePatient } from '../utils/validation'
import { IconAlert, IconArrowLeft } from './icons'

const EMPTY_VALUES = {
  name: '',
  age: '',
  gender: '',
  ward: '',
  department: '',
  doctor: '',
  admission_date: todayISO(),
  status: 'Admitted',
}

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p className="field-error" id={id} role="alert">
      <IconAlert className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  )
}

function Select({ id, label, value, options, onChange, error, placeholder, disabled, loading }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label} <span className="text-rose-500">*</span>
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`field-input ${error ? 'field-input-error' : ''}`}
      >
        <option value="">{loading ? 'Loading options…' : placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export default function PatientForm({
  mode = 'create',
  initialValues,
  options,
  optionsLoading = false,
  submitting = false,
  serverErrors = {},
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({ ...EMPTY_VALUES, ...(initialValues || {}) }))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const clientErrors = useMemo(() => validatePatient(values, options), [values, options])

  const visibleErrors = useMemo(() => {
    const merged = {}
    for (const field of Object.keys({ ...clientErrors, ...serverErrors })) {
      const clientMessage = clientErrors[field]
      const alreadyTouched = touched[field] || submitted
      const serverMessage = serverErrors[field]
      if (serverMessage) merged[field] = serverMessage
      else if (alreadyTouched && clientMessage) merged[field] = clientMessage
    }
    return merged
  }, [clientErrors, serverErrors, touched, submitted])

  const update = (field) => (event) => {
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
  }

  const markTouched = (field) => () => setTouched((current) => ({ ...current, [field]: true }))

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(clientErrors).length > 0) {
      const firstField = Object.keys(clientErrors)[0]
      document.getElementById(firstField)?.focus()
      return
    }
    onSubmit(values)
  }

  return (
    <form className="card overflow-hidden" onSubmit={handleSubmit} noValidate>
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-slate-900">
          {mode === 'create' ? 'Admission details' : 'Patient details'}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Fields marked <span className="text-rose-500">*</span> are required. Validation runs in the browser
          and again on the server.
        </p>
      </div>

      <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="name">
            Full name <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={update('name')}
            onBlur={markTouched('name')}
            maxLength={100}
            placeholder="e.g. Ananya Sharma"
            autoComplete="off"
            aria-invalid={Boolean(visibleErrors.name)}
            aria-describedby={visibleErrors.name ? 'name-error' : 'name-hint'}
            className={`field-input ${visibleErrors.name ? 'field-input-error' : ''}`}
          />
          <p className="mt-1.5 text-xs text-slate-500" id="name-hint">
            Letters and spaces only — numbers and special characters are rejected.
          </p>
          <FieldError id="name-error" message={visibleErrors.name} />
        </div>

        <div>
          <label className="field-label" htmlFor="age">
            Age (years) <span className="text-rose-500">*</span>
          </label>
          <input
            id="age"
            name="age"
            type="number"
            inputMode="numeric"
            min="0"
            max="120"
            step="1"
            value={values.age}
            onChange={update('age')}
            onBlur={markTouched('age')}
            placeholder="0 – 120"
            aria-invalid={Boolean(visibleErrors.age)}
            aria-describedby={visibleErrors.age ? 'age-error' : undefined}
            className={`field-input ${visibleErrors.age ? 'field-input-error' : ''}`}
          />
          <FieldError id="age-error" message={visibleErrors.age} />
        </div>

        <Select
          id="gender"
          label="Gender"
          value={values.gender}
          options={options?.genders || []}
          onChange={update('gender')}
          error={visibleErrors.gender}
          placeholder="Select gender"
          loading={optionsLoading}
        />

        <Select
          id="ward"
          label="Ward"
          value={values.ward}
          options={options?.wards || []}
          onChange={update('ward')}
          error={visibleErrors.ward}
          placeholder="Select ward"
          loading={optionsLoading}
        />

        <Select
          id="department"
          label="Department"
          value={values.department}
          options={options?.departments || []}
          onChange={update('department')}
          error={visibleErrors.department}
          placeholder="Select department"
          loading={optionsLoading}
        />

        <Select
          id="doctor"
          label="Attending doctor"
          value={values.doctor}
          options={options?.doctors || []}
          onChange={update('doctor')}
          error={visibleErrors.doctor}
          placeholder="Select doctor"
          loading={optionsLoading}
        />

        <div>
          <label className="field-label" htmlFor="admission_date">
            Admission date <span className="text-rose-500">*</span>
          </label>
          <input
            id="admission_date"
            name="admission_date"
            type="date"
            value={values.admission_date}
            max={todayISO()}
            onChange={update('admission_date')}
            onBlur={markTouched('admission_date')}
            aria-invalid={Boolean(visibleErrors.admission_date)}
            aria-describedby={visibleErrors.admission_date ? 'admission_date-error' : undefined}
            className={`field-input ${visibleErrors.admission_date ? 'field-input-error' : ''}`}
          />
          <p className="mt-1.5 text-xs text-slate-500">Future dates are not allowed.</p>
          <FieldError id="admission_date-error" message={visibleErrors.admission_date} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          <IconArrowLeft className="h-4 w-4" />
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {mode === 'create' ? 'Admitting…' : 'Saving…'}
            </>
          ) : mode === 'create' ? (
            'Admit patient'
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  )
}
