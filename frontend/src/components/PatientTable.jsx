import { Link } from 'react-router-dom'

import StatusBadge from './StatusBadge'
import { TableSkeleton } from './Skeleton'
import { IconEdit, IconTrash, IconCheckCircle } from './icons'
import { daysSince, formatDate, initials } from '../utils/format'

function ActionButtons({ patient, onDischarge, onDelete, busy }) {
  const discharged = patient.status === 'Discharged'
  return (
    <div className="flex items-center gap-1">
      <Link
        to={`/patients/${patient.id}/edit`}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
        aria-label={`Edit ${patient.name}`}
        title="Edit patient"
      >
        <IconEdit className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={() => onDischarge(patient)}
        disabled={discharged || busy}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label={`Discharge ${patient.name}`}
        title={discharged ? 'Patient is already discharged' : 'Discharge patient'}
      >
        <IconCheckCircle className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(patient)}
        disabled={busy}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
        aria-label={`Delete ${patient.name}`}
        title="Delete patient"
      >
        <IconTrash className="h-4 w-4" />
      </button>
    </div>
  )
}

function PatientIdentity({ patient }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">
        {initials(patient.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{patient.name}</p>
        <p className="text-xs text-slate-500">
          {patient.gender} · {patient.age} yrs
        </p>
      </div>
    </div>
  )
}

export default function PatientTable({ patients, loading, busyId, onDischarge, onDelete }) {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100">
        <TableSkeleton rows={6} columns={7} />
      </div>
    )
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="table-head">
            <tr>
              <th scope="col" className="px-4 py-3">Patient</th>
              <th scope="col" className="px-4 py-3">Ward</th>
              <th scope="col" className="hidden px-4 py-3 xl:table-cell">Department</th>
              <th scope="col" className="px-4 py-3">Doctor</th>
              <th scope="col" className="px-4 py-3">Admitted</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {patients.map((patient) => (
              <tr key={patient.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <PatientIdentity patient={patient} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{patient.ward}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-slate-700 xl:table-cell">
                  {patient.department}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{patient.doctor}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  <span>{formatDate(patient.admission_date)}</span>
                  <span className="block text-xs text-slate-400">
                    {daysSince(patient.admission_date)} day(s)
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={patient.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <ActionButtons
                      patient={patient}
                      onDischarge={onDischarge}
                      onDelete={onDelete}
                      busy={busyId === patient.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {patients.map((patient) => (
          <li key={patient.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <PatientIdentity patient={patient} />
              <StatusBadge status={patient.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="font-medium text-slate-400">Ward</dt>
                <dd className="text-slate-700">{patient.ward}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-400">Department</dt>
                <dd className="text-slate-700">{patient.department}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-400">Doctor</dt>
                <dd className="text-slate-700">{patient.doctor}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-400">Admitted</dt>
                <dd className="text-slate-700">{formatDate(patient.admission_date)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2">
              <ActionButtons
                patient={patient}
                onDischarge={onDischarge}
                onDelete={onDelete}
                busy={busyId === patient.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
