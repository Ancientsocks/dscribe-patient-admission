import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// The register renders the same records twice (desktop table + mobile cards),
// so assertions use findAllByText and inspect the first match.
async function expectPatientVisible(name) {
  const matches = await screen.findAllByText(name)
  expect(matches.length).toBeGreaterThan(0)
}
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PatientsPage from './PatientsPage'
import { deletePatient, dischargePatient, fetchOptions, fetchPatients } from '../services/patients'
import { OptionsProvider } from '../hooks/useOptions'
import { ToastProvider } from '../hooks/useToast'

vi.mock('../services/patients')

const OPTIONS = {
  genders: ['Male', 'Female', 'Other'],
  wards: ['General Ward', 'ICU'],
  departments: ['Cardiology', 'Neurology'],
  doctors: ['Dr. Aisha Verma', 'Dr. Rohan Mehta'],
  statuses: ['Admitted', 'Discharged'],
}

const PATIENTS = [
  {
    id: 1,
    name: 'Ananya Sharma',
    age: 34,
    gender: 'Female',
    ward: 'ICU',
    department: 'Cardiology',
    doctor: 'Dr. Aisha Verma',
    admission_date: '2026-11-13',
    status: 'Admitted',
  },
  {
    id: 2,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    ward: 'General Ward',
    department: 'Neurology',
    doctor: 'Dr. Rohan Mehta',
    admission_date: '2026-11-10',
    status: 'Admitted',
  },
]

const pageOf = (items, overrides = {}) => ({
  items,
  total: items.length,
  page: 1,
  page_size: 10,
  total_pages: 1,
  has_next: false,
  has_previous: false,
  applied_filters: {},
  ...overrides,
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <OptionsProvider>
          <PatientsPage />
        </OptionsProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchOptions.mockResolvedValue(OPTIONS)
  fetchPatients.mockResolvedValue(pageOf(PATIENTS))
})

describe('PatientsPage', () => {
  it('loads and renders the register with a result count', async () => {
    renderPage()

    await expectPatientVisible('Ananya Sharma')
    await expectPatientVisible('John Doe')
    expect(screen.getByText(/matching patient\(s\)/)).toHaveTextContent('2 matching patient(s)')
    expect(fetchPatients).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, page_size: 10 }),
      expect.anything(),
    )
  })

  it('debounces name search and sends it to the API', async () => {
    renderPage()
    await expectPatientVisible('Ananya Sharma')

    fireEvent.change(screen.getByLabelText(/search by name/i), { target: { value: 'ana' } })

    await waitFor(
      () =>
        expect(fetchPatients).toHaveBeenLastCalledWith(
          expect.objectContaining({ search: 'ana', page: 1 }),
          expect.anything(),
        ),
      { timeout: 2000 },
    )
  })

  it('sends the ward filter to the API', async () => {
    renderPage()
    await expectPatientVisible('Ananya Sharma')

    fireEvent.change(screen.getByLabelText(/^ward/i), { target: { value: 'ICU' } })

    await waitFor(() =>
      expect(fetchPatients).toHaveBeenLastCalledWith(
        expect.objectContaining({ ward: 'ICU', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('combines every filter in a single request and clears them all', async () => {
    renderPage()
    await expectPatientVisible('Ananya Sharma')

    fireEvent.change(screen.getByLabelText(/^ward/i), { target: { value: 'ICU' } })
    fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Cardiology' } })
    fireEvent.change(screen.getByLabelText(/doctor/i), { target: { value: 'Dr. Aisha Verma' } })
    fireEvent.click(screen.getByRole('button', { name: 'Admitted' }))

    await waitFor(() =>
      expect(fetchPatients).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ward: 'ICU',
          department: 'Cardiology',
          doctor: 'Dr. Aisha Verma',
          status: 'Admitted',
        }),
        expect.anything(),
      ),
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0])

    await waitFor(() => {
      const [params] = fetchPatients.mock.calls.at(-1)
      expect(params).toEqual({ page: 1, page_size: 10 })
    })
  })

  it('shows the empty state when no patients exist', async () => {
    fetchPatients.mockResolvedValue(pageOf([]))

    renderPage()

    expect(await screen.findByText('No patients admitted yet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /add patient/i }).length).toBeGreaterThan(0)
  })

  it('shows a distinct message when filters match nothing', async () => {
    fetchPatients.mockResolvedValue(pageOf([]))
    renderPage()
    await screen.findByText('No patients admitted yet')

    fireEvent.change(screen.getByLabelText(/search by name/i), { target: { value: 'zzz' } })

    expect(await screen.findByText('No patients match these filters', {}, { timeout: 2000 })).toBeInTheDocument()
  })

  it('shows an error state and retries the request', async () => {
    fetchPatients.mockRejectedValueOnce({
      isApiError: true,
      message: 'Cannot reach the patient API.',
      fieldErrors: {},
      status: null,
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Could not load patients' })).toBeInTheDocument()
    expect(screen.getByText('Cannot reach the patient API.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    await expectPatientVisible('Ananya Sharma')
  })

  it('deletes a patient only after confirmation', async () => {
    deletePatient.mockResolvedValue({ message: 'deleted' })

    renderPage()
    await expectPatientVisible('Ananya Sharma')

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete Ananya Sharma' })[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/will be permanently removed/i)).toBeInTheDocument()
    expect(deletePatient).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Delete patient' }))

    await waitFor(() => expect(deletePatient).toHaveBeenCalledWith(1))
    expect(await screen.findByText('Patient deleted')).toBeInTheDocument()
  })

  it('discharges a patient only after confirmation', async () => {
    dischargePatient.mockResolvedValue({ id: 2, status: 'Discharged' })

    renderPage()
    await expectPatientVisible('John Doe')

    fireEvent.click(screen.getAllByRole('button', { name: 'Discharge John Doe' })[0])
    expect(screen.getByText(/will be marked as Discharged/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm discharge' }))

    await waitFor(() => expect(dischargePatient).toHaveBeenCalledWith(2))
    expect(await screen.findByText('Patient discharged')).toBeInTheDocument()
  })

  it('navigates between pages and reports a failed action', async () => {
    fetchPatients.mockResolvedValue(pageOf(PATIENTS, { total: 12, total_pages: 2, has_next: true }))
    deletePatient.mockRejectedValue({
      isApiError: true,
      message: 'Patient already discharged.',
      fieldErrors: {},
      status: 409,
    })

    renderPage()
    await expectPatientVisible('Ananya Sharma')

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() =>
      expect(fetchPatients).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.anything()),
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete Ananya Sharma' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Delete patient' }))

    expect(await screen.findByText('Action failed')).toBeInTheDocument()
    expect(screen.getByText('Patient already discharged.')).toBeInTheDocument()
  })
})
