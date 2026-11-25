import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { fetchOptions } from '../services/patients'
import { toApiError } from '../services/api'

const OptionsContext = createContext(null)

const FALLBACK_LIMITS = { age_min: 0, age_max: 120, name_max_length: 100, max_page_size: 100 }

/**
 * Loads the central option lists (genders, wards, departments, doctors) from
 * the backend once and shares them with every page and form.
 */
export function OptionsProvider({ children }) {
  const [options, setOptions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOptions(signal)
      setOptions({ ...data, limits: { ...FALLBACK_LIMITS, ...(data.limits || {}) } })
    } catch (caught) {
      if (!caught?.cancelled) {
        setError(toApiError(caught).message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const value = useMemo(
    () => ({ options, loading, error, reload: () => load() }),
    [options, loading, error, load],
  )

  return <OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>
}

export function useOptions() {
  const context = useContext(OptionsContext)
  if (!context) throw new Error('useOptions must be used inside an OptionsProvider')
  return context
}
