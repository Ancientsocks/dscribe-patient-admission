import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PatientForm from './PatientForm'
import { todayISO } from '../utils/validation'

const OPTIONS = {
  genders: ['Male', 'Female', 'Other'],
  wards: ['General Ward', 'ICU'],
  departments: ['Cardiology', 'Neurology'],
  doctors: ['Dr. Aisha Verma', 'Dr. Rohan Mehta'],
}

function renderForm(props = {}) {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  render(<PatientForm options={OPTIONS} onSubmit={onSubmit} onCancel={onCancel} {...props} />)
  return { onSubmit, onCancel }
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ananya Sharma' } })
  fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '34' } })
  fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'Female' } })
  fireEvent.change(screen.getByLabelText(/^ward/i), { target: { value: 'ICU' } })
  fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Cardiology' } })
  fireEvent.change(screen.getByLabelText(/attending doctor/i), { target: { value: 'Dr. Aisha Verma' } })
}

describe('PatientForm', () => {
  it('renders every field with the date capped at today', () => {
    renderForm()

    for (const label of [/full name/i, /age/i, /gender/i, /^ward/i, /department/i, /attending doctor/i, /admission date/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/admission date/i)).toHaveValue(todayISO())
    expect(screen.getByLabelText(/admission date/i)).toHaveAttribute('max', todayISO())
    expect(screen.getByRole('button', { name: 'Admit patient' })).toBeEnabled()
  })

  it('blocks submission and shows inline errors for an empty form', () => {
    const { onSubmit } = renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Admit patient' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Age is required.')).toBeInTheDocument()
    expect(screen.getByText('Gender is required.')).toBeInTheDocument()
    expect(screen.getByText('Ward is required.')).toBeInTheDocument()
    expect(screen.getByText('Department is required.')).toBeInTheDocument()
    expect(screen.getByText('Doctor is required.')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('rejects a name with numbers, an out-of-range age and a future date', () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John123' } })
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText(/admission date/i), { target: { value: '2999-01-01' } })
    fillValidForm()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John123' } })
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText(/admission date/i), { target: { value: '2999-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Admit patient' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/letters and single spaces/i)).toBeInTheDocument()
    expect(screen.getByText(/between 0 and 120/i)).toBeInTheDocument()
    expect(screen.getByText(/cannot be in the future/i)).toBeInTheDocument()
  })

  it('submits the values once the form is valid', () => {
    const { onSubmit } = renderForm()

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Admit patient' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Ananya Sharma',
      age: '34',
      gender: 'Female',
      ward: 'ICU',
      department: 'Cardiology',
      doctor: 'Dr. Aisha Verma',
    })
  })

  it('surfaces server field errors next to the matching input', () => {
    const { onSubmit } = renderForm({
      serverErrors: { name: 'An identical admission already exists.' },
    })

    expect(screen.getByText('An identical admission already exists.')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables the actions and shows progress while submitting', () => {
    renderForm({ submitting: true, mode: 'edit' })

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('calls onCancel without submitting', () => {
    const { onSubmit, onCancel } = renderForm()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
