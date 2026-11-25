import axios from 'axios'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

/**
 * Convert any axios/network/API failure into a predictable shape the UI can render.
 * { message: string, fieldErrors: { [field]: string }, status: number | null }
 */
export function toApiError(error) {
  // Already normalised (pages call this again on rejected promises) - keep the detail.
  if (error?.isApiError) return error

  if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') {
    return { message: 'Request cancelled.', fieldErrors: {}, status: null, cancelled: true, isApiError: true }
  }

  const response = error?.response
  if (!response) {
    return {
      message:
        'Cannot reach the patient API. Check your network connection and confirm the backend server is running.',
      fieldErrors: {},
      status: null,
      isApiError: true,
    }
  }

  const payload = response.data || {}
  const apiError = payload.error || {}
  const fieldErrors = {}
  for (const detail of apiError.details || []) {
    if (detail?.field) fieldErrors[detail.field] = detail.message
  }

  let message = apiError.message || payload.detail || payload.message
  if (!message) {
    if (response.status === 404) message = 'The requested record could not be found.'
    else if (response.status === 422) message = 'Please review the highlighted fields.'
    else if (response.status >= 500) message = 'The server ran into a problem. Please try again.'
    else message = 'Something went wrong. Please try again.'
  }

  return { message, fieldErrors, status: response.status, isApiError: true }
}

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)

export default api
