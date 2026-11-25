const NAME_PATTERN = /^\p{L}+(?: \p{L}+)*$/u
const WHOLE_NUMBER = /^\d+$/

export const AGE_MIN = 0
export const AGE_MAX = 120
export const NAME_MAX_LENGTH = 100

export function normaliseName(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

/**
 * Validate the admission form. Returns an object of field -> message.
 * Empty object means the form is valid.
 */
export function validatePatient(values, options) {
  const errors = {}
  const name = normaliseName(values.name)
  const age = String(values.age ?? '').trim()

  if (!name) {
    errors.name = 'Name is required.'
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Name cannot be longer than ${NAME_MAX_LENGTH} characters.`
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = 'Name may contain only letters and single spaces between names.'
  }

  if (!age) {
    errors.age = 'Age is required.'
  } else if (!WHOLE_NUMBER.test(age)) {
    errors.age = 'Age must be a whole number (decimals are not allowed).'
  } else {
    const numericAge = Number(age)
    if (numericAge < AGE_MIN || numericAge > AGE_MAX) {
      errors.age = `Age must be between ${AGE_MIN} and ${AGE_MAX}.`
    }
  }

  if (!values.gender) errors.gender = 'Gender is required.'
  else if (options?.genders && !options.genders.includes(values.gender)) {
    errors.gender = 'Select a valid gender.'
  }

  if (!values.ward) errors.ward = 'Ward is required.'
  else if (options?.wards && !options.wards.includes(values.ward)) {
    errors.ward = 'Select a valid ward.'
  }

  if (!values.department) errors.department = 'Department is required.'
  else if (options?.departments && !options.departments.includes(values.department)) {
    errors.department = 'Select a valid department.'
  }

  if (!values.doctor) errors.doctor = 'Doctor is required.'
  else if (options?.doctors && !options.doctors.includes(values.doctor)) {
    errors.doctor = 'Select a doctor from the roster.'
  }

  if (!values.admission_date) {
    errors.admission_date = 'Admission date is required.'
  } else if (!isValidISODate(values.admission_date)) {
    errors.admission_date = 'Enter a valid admission date.'
  } else if (values.admission_date > todayISO()) {
    errors.admission_date = 'Admission date cannot be in the future.'
  }

  return errors
}

export function toPayload(values) {
  return {
    name: normaliseName(values.name),
    age: Number(String(values.age).trim()),
    gender: values.gender,
    ward: values.ward,
    department: values.department,
    doctor: values.doctor,
    admission_date: values.admission_date,
    ...(values.status ? { status: values.status } : {}),
  }
}
