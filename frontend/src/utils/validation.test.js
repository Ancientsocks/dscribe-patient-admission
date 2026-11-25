import { describe, expect, it } from 'vitest'

import { normaliseName, toPayload, todayISO, validatePatient } from './validation'

const OPTIONS = {
  genders: ['Male', 'Female', 'Other'],
  wards: ['General Ward', 'ICU'],
  departments: ['Cardiology', 'Neurology'],
  doctors: ['Dr. Aisha Verma', 'Dr. Rohan Mehta'],
}

const VALID = {
  name: 'Ananya Sharma',
  age: '34',
  gender: 'Female',
  ward: 'ICU',
  department: 'Cardiology',
  doctor: 'Dr. Aisha Verma',
  admission_date: '2026-01-05',
}

const futureDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

describe('normaliseName', () => {
  it('trims and collapses repeated whitespace', () => {
    expect(normaliseName('  Ananya   Sharma  ')).toBe('Ananya Sharma')
  })

  it('handles null and undefined', () => {
    expect(normaliseName(null)).toBe('')
    expect(normaliseName(undefined)).toBe('')
  })
})

describe('validatePatient', () => {
  it('accepts a fully valid admission', () => {
    expect(validatePatient(VALID, OPTIONS)).toEqual({})
  })

  it('accepts the age boundaries 0 and 120', () => {
    expect(validatePatient({ ...VALID, age: '0' }, OPTIONS)).toEqual({})
    expect(validatePatient({ ...VALID, age: '120' }, OPTIONS)).toEqual({})
  })

  it('requires every field', () => {
    const errors = validatePatient({}, OPTIONS)
    expect(Object.keys(errors).sort()).toEqual([
      'admission_date',
      'age',
      'department',
      'doctor',
      'gender',
      'name',
      'ward',
    ])
  })

  it.each(['John123', 'John@Doe', 'O\'Brien', '12345'])('rejects the name %s', (name) => {
    expect(validatePatient({ ...VALID, name }, OPTIONS).name).toMatch(/letters/i)
  })

  it('rejects names longer than 100 characters', () => {
    expect(validatePatient({ ...VALID, name: 'a'.repeat(101) }, OPTIONS).name).toMatch(/100/)
  })

  it.each([
    ['34.5', /whole number/i],
    ['-1', /whole number/i],
    ['abc', /whole number/i],
    ['121', /between 0 and 120/i],
  ])('rejects the age %s', (age, message) => {
    expect(validatePatient({ ...VALID, age }, OPTIONS).age).toMatch(message)
  })

  it('rejects values that are not in the central option lists', () => {
    const errors = validatePatient(
      { ...VALID, gender: 'Unknown', ward: 'Roof', department: 'Astrology', doctor: 'Dr. Who' },
      OPTIONS,
    )
    expect(errors.gender).toMatch(/valid gender/i)
    expect(errors.ward).toMatch(/valid ward/i)
    expect(errors.department).toMatch(/valid department/i)
    expect(errors.doctor).toMatch(/roster/i)
  })

  it('rejects a future admission date', () => {
    expect(validatePatient({ ...VALID, admission_date: futureDate() }, OPTIONS).admission_date).toMatch(
      /future/i,
    )
  })

  it('rejects an impossible calendar date', () => {
    expect(validatePatient({ ...VALID, admission_date: '2026-02-31' }, OPTIONS).admission_date).toMatch(
      /valid admission date/i,
    )
  })

  it('accepts today as an admission date', () => {
    expect(validatePatient({ ...VALID, admission_date: todayISO() }, OPTIONS)).toEqual({})
  })
})

describe('toPayload', () => {
  it('trims the name, casts the age and omits an unset status', () => {
    expect(toPayload({ ...VALID, name: '  Ananya  Sharma ' })).toEqual({
      name: 'Ananya Sharma',
      age: 34,
      gender: 'Female',
      ward: 'ICU',
      department: 'Cardiology',
      doctor: 'Dr. Aisha Verma',
      admission_date: '2026-01-05',
    })
  })

  it('includes the status when supplied', () => {
    expect(toPayload({ ...VALID, status: 'Admitted' }).status).toBe('Admitted')
  })
})
