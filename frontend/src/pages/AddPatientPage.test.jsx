import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AddPatientPage from './AddPatientPage'
import { createPatient, fetchOptions } from '../services/patients'
import { OptionsProvider } from '../hooks/useOptions'
import { ToastProvider } from '../hooks/useToast'

vi.mock('../services/patients')

const OPTIONS = {
  genders: ['Male', 'Female', 'Other'],
  wards: ['General Ward', 'ICU'],
  departments: ['Cardiology', 'Neurology'],
  doctors: ['Dr. Aisha Verma', 'Dr. Rohan Mehta'],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patients/new']}>
      <ToastProvider>
        <OptionsProvider>
          <Routes>
            <Route path="/patients/new" element={<AddPatientPage />} />
            <Route path="/patients" element={<div>Patients route</div>} />
          </Routes>
        </OptionsProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ananya Sharma' } })
  fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '34' } })
  fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'Female' } })
  fireEvent.change(screen.getByLabelText(/^ward/i), { target: { value: 'ICU' } })
  fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Cardiology' } })
  fireEvent.change(screen.getByLabelText(/attending doctor/i), { target: { value: 'Dr. Aisha Verma' } })
}

beforeEach(() => {
  fetchOptions.mockResolvedValue(OPTIONS)
  createPatient.mockResolvedValue({
    id: 9,
    name: 'Ananya Sharma',
    ward: 'ICU',
    doctor: 'Dr. Aisha Verma',
    status: 'Admitted',
  })
})

describe('AddPatientPage', () => {
  it('creates the patient and returns to the register', async () => {
    renderPage()

    await screen.findByLabelText(/full name/i)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Admit patient' }))

    await waitFor(() => expect(createPatient).toHaveBeenCalledTimes(1))
    expect(createPatient.mock.calls[0][0]).toMatchObject({
      name: 'Ananya Sharma',
      age: 34,
      gender: 'Female',
      ward: 'ICU',
      department: 'Cardiology',
      doctor: 'Dr. Aisha Verma',
      status: 'Admitted',
    })
    expect(await screen.findByText('Patients route')).toBeInTheDocument()
    expect(screen.getByText('Patient admitted')).toBeInTheDocument()
  })

  it('does not call the API when client validation fails', async () => {
    renderPage()

    await screen.findByLabelText(/full name/i)
    fireEvent.click(screen.getByRole('button', { name: 'Admit patient' }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(createPatient).not.toHaveBeenCalled()
  })

  it('maps backend field errors onto the form and shows the message', async () => {
    createPatient.mockRejectedValue({
      isApiError: true,
      message: 'An identical admission already exists.',
      fieldErrors: { name: 'An identical admission already exists.' },
      status: 409,
    })

    renderPage()
    await screen.findByLabelText(/full name/i)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Admit patient' }))

    const messages = await screen.findAllByText('An identical admission already exists.')
    expect(messages.length).toBeGreaterThan(0)
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(screen.queryByText('Patients route')).not.toBeInTheDocument()
  })
})
