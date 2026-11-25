import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EditPatientPage from './EditPatientPage'
import { fetchOptions, fetchPatient, updatePatient } from '../services/patients'
import { OptionsProvider } from '../hooks/useOptions'
import { ToastProvider } from '../hooks/useToast'

vi.mock('../services/patients')

const OPTIONS = {
  genders: ['Male', 'Female', 'Other'],
  wards: ['General Ward', 'ICU'],
  departments: ['Cardiology', 'Neurology'],
  doctors: ['Dr. Aisha Verma', 'Dr. Rohan Mehta'],
}

const PATIENT = {
  id: 5,
  name: 'Ananya Sharma',
  age: 34,
  gender: 'Female',
  ward: 'ICU',
  department: 'Cardiology',
  doctor: 'Dr. Aisha Verma',
  admission_date: '2026-11-13',
  status: 'Admitted',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patients/5/edit']}>
      <ToastProvider>
        <OptionsProvider>
          <Routes>
            <Route path="/patients/:id/edit" element={<EditPatientPage />} />
            <Route path="/patients" element={<div>Patients route</div>} />
          </Routes>
        </OptionsProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchOptions.mockResolvedValue(OPTIONS)
  fetchPatient.mockResolvedValue(PATIENT)
  updatePatient.mockResolvedValue({ ...PATIENT, ward: 'General Ward' })
})

describe('EditPatientPage', () => {
  it('prefills the form from the API and saves the changes', async () => {
    renderPage()

    expect(await screen.findByLabelText(/full name/i)).toHaveValue('Ananya Sharma')
    expect(screen.getByLabelText(/age/i)).toHaveValue(34)
    expect(screen.getByLabelText(/^ward/i)).toHaveValue('ICU')
    expect(fetchPatient).toHaveBeenCalledWith('5', expect.anything())

    fireEvent.change(screen.getByLabelText(/^ward/i), { target: { value: 'General Ward' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updatePatient).toHaveBeenCalledTimes(1))
    expect(updatePatient).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ name: 'Ananya Sharma', age: 34, ward: 'General Ward' }),
    )
    expect(await screen.findByText('Patients route')).toBeInTheDocument()
    expect(screen.getByText('Patient updated')).toBeInTheDocument()
  })

  it('shows a not-found state for a missing record', async () => {
    fetchPatient.mockRejectedValue({
      isApiError: true,
      message: 'Patient 5 not found.',
      fieldErrors: {},
      status: 404,
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Patient not found' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
    expect(updatePatient).not.toHaveBeenCalled()
  })

  it('keeps the form open and shows the server message when saving fails', async () => {
    updatePatient.mockRejectedValue({
      isApiError: true,
      message: 'A discharged patient cannot be re-admitted.',
      fieldErrors: { status: 'A discharged patient cannot be re-admitted.' },
      status: 409,
    })

    renderPage()
    await screen.findByLabelText(/full name/i)
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    const messages = await screen.findAllByText('A discharged patient cannot be re-admitted.')
    expect(messages.length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.queryByText('Patients route')).not.toBeInTheDocument()
  })
})
