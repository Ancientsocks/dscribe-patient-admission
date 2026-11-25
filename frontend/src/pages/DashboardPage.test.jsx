import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from './DashboardPage'
import { fetchDashboardStats } from '../services/patients'

vi.mock('../services/patients')

const STATS = {
  total_patients: 12,
  admitted_patients: 9,
  discharged_patients: 3,
  ward_distribution: [
    { name: 'ICU', count: 5 },
    { name: 'General Ward', count: 4 },
  ],
  department_distribution: [{ name: 'Cardiology', count: 6 }],
  recent_admissions: [
    {
      id: 1,
      name: 'Ananya Sharma',
      ward: 'ICU',
      department: 'Cardiology',
      doctor: 'Dr. Aisha Verma',
      admission_date: '2026-11-13',
      status: 'Admitted',
    },
  ],
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchDashboardStats.mockResolvedValue(STATS)
})

describe('DashboardPage', () => {
  it('renders totals, distributions and recent admissions from the API', async () => {
    renderDashboard()

    expect(await screen.findByText('Ananya Sharma')).toBeInTheDocument()
    expect(screen.getByText('Total patients')).toBeInTheDocument()
    expect(screen.getByText('Currently admitted')).toBeInTheDocument()
    expect(screen.getByText('75% of all records')).toBeInTheDocument()
    expect(screen.getByText('Discharged')).toBeInTheDocument()
    expect(screen.getByText('Active wards')).toBeInTheDocument()
    expect(screen.getByText('ICU')).toBeInTheDocument()
    expect(screen.getByText('Cardiology')).toBeInTheDocument()
    expect(screen.getByText(/ICU · Cardiology · Dr\. Aisha Verma/)).toBeInTheDocument()
    expect(screen.getByText('Admitted')).toBeInTheDocument()
  })

  it('shows an error state when the stats request fails', async () => {
    fetchDashboardStats.mockRejectedValue({
      isApiError: true,
      message: 'Cannot reach the patient API.',
      fieldErrors: {},
      status: null,
    })

    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'Dashboard unavailable' })).toBeInTheDocument()
    expect(screen.getByText('Cannot reach the patient API.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no admissions', async () => {
    fetchDashboardStats.mockResolvedValue({ ...STATS, recent_admissions: [] })

    renderDashboard()

    expect(await screen.findByText('No admissions yet')).toBeInTheDocument()
  })
})
