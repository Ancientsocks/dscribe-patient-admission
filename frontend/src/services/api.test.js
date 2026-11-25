import { describe, expect, it } from 'vitest'

import { toApiError } from './api'

describe('toApiError', () => {
  it('maps the backend error envelope, including field details', () => {
    const error = {
      response: {
        status: 422,
        data: {
          detail: 'Name may contain only letters and spaces.',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name may contain only letters and spaces.',
            details: [
              { field: 'name', message: 'Name may contain only letters and spaces.' },
              { field: 'age', message: 'Age must be between 0 and 120.' },
            ],
          },
        },
      },
    }

    expect(toApiError(error)).toEqual({
      message: 'Name may contain only letters and spaces.',
      fieldErrors: {
        name: 'Name may contain only letters and spaces.',
        age: 'Age must be between 0 and 120.',
      },
      status: 422,
      isApiError: true,
    })
  })

  it('falls back to the detail field when there is no error envelope', () => {
    const error = { response: { status: 409, data: { detail: 'Duplicate admission.' } } }
    expect(toApiError(error).message).toBe('Duplicate admission.')
  })

  it('produces friendly defaults for empty error bodies', () => {
    expect(toApiError({ response: { status: 404, data: {} } }).message).toMatch(/could not be found/i)
    expect(toApiError({ response: { status: 500, data: {} } }).message).toMatch(/server ran into a problem/i)
    expect(toApiError({ response: { status: 400, data: {} } }).message).toMatch(/something went wrong/i)
  })

  it('reports an unreachable API for network failures', () => {
    const result = toApiError(new Error('Network Error'))
    expect(result.status).toBeNull()
    expect(result.message).toMatch(/cannot reach the patient api/i)
  })

  it('marks cancelled requests so pages can ignore them', () => {
    const result = toApiError({ code: 'ERR_CANCELED' })
    expect(result.cancelled).toBe(true)
    expect(result.message).toMatch(/cancelled/i)
  })

  it('is idempotent so normalised errors keep their detail', () => {
    const once = toApiError({ response: { status: 404, data: {} } })
    expect(toApiError(once)).toBe(once)
    expect(once.message).toMatch(/could not be found/i)
  })
})
