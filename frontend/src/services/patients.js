import api from './api'

export async function fetchPatients(params = {}, signal) {
  const { data } = await api.get('/patients', { params, signal })
  return data
}

export async function fetchPatient(id, signal) {
  const { data } = await api.get(`/patients/${id}`, { signal })
  return data
}

export async function createPatient(payload) {
  const { data } = await api.post('/patients', payload)
  return data
}

export async function updatePatient(id, payload) {
  const { data } = await api.put(`/patients/${id}`, payload)
  return data
}

export async function deletePatient(id) {
  const { data } = await api.delete(`/patients/${id}`)
  return data
}

export async function dischargePatient(id) {
  const { data } = await api.patch(`/patients/${id}/discharge`)
  return data
}

export async function fetchDashboardStats(signal) {
  const { data } = await api.get('/dashboard/stats', { signal })
  return data
}

export async function fetchOptions(signal) {
  const { data } = await api.get('/options', { signal })
  return data
}

export async function fetchHealth(signal) {
  const { data } = await api.get('/health', { signal })
  return data
}
