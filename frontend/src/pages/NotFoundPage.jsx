import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">404</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Page not found</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for does not exist. Head back to the dashboard to continue managing
        admissions.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  )
}
