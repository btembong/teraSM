'use client'

import { useEffect, useState } from 'react'
import { Briefcase, MapPin, Clock } from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  description: string
  location: string | null
  jobType: string
  salary: string | null
  deadline: string | null
  _count: { applications: number }
  myApplication: { status: string } | null
}

const typeColor: Record<string, string> = {
  FULL_TIME: 'bg-blue-600 text-white',
  PART_TIME: 'bg-blue-50 text-blue-700',
  INTERNSHIP: 'bg-blue-100 text-blue-800',
  CONTRACT: 'bg-gray-100 text-gray-600',
  VOLUNTEER: 'bg-gray-100 text-gray-500',
}

const appStatusColor: Record<string, string> = {
  APPLIED: 'bg-blue-50 text-blue-700',
  REVIEWING: 'bg-blue-100 text-blue-600',
  INTERVIEW: 'bg-blue-100 text-blue-800',
  OFFERED: 'bg-blue-600 text-white',
  ACCEPTED: 'bg-blue-700 text-white',
  REJECTED: 'bg-gray-100 text-gray-500',
  WITHDRAWN: 'bg-gray-100 text-gray-400',
}

export default function StudentCareerPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'all' | 'applied'>('all')

  useEffect(() => {
    fetch('/api/jobs')
      .then((r) => r.json())
      .then((data) => { setJobs(data); setLoading(false) })
  }, [])

  const applyJob = async (jobId: string) => {
    setSubmitting(true)
    const res = await fetch('/api/jobs/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, coverLetter }),
    })
    if (res.ok) {
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, myApplication: { status: 'APPLIED' } } : j))
    }
    setApplying(null)
    setCoverLetter('')
    setSubmitting(false)
  }

  const displayed = tab === 'applied' ? jobs.filter((j) => j.myApplication) : jobs

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Career Center</h1>
        <p className="text-gray-500">Job board, internships, and opportunities</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['all', 'applied'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'all' ? 'All Jobs' : 'My Applications'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading jobs...</div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{tab === 'applied' ? 'No applications yet' : 'No jobs posted'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                      {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                      {job.salary && <span>{job.salary}</span>}
                      {job.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due {new Date(job.deadline).toLocaleDateString()}</span>}
                      <span>{job._count.applications} applicants</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[job.jobType] ?? ''}`}>
                    {job.jobType.replace('_', ' ')}
                  </span>
                  {job.myApplication ? (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${appStatusColor[job.myApplication.status] ?? ''}`}>
                      {job.myApplication.status}
                    </span>
                  ) : (
                    <button
                      onClick={() => setApplying(job.id)}
                      className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>

              {applying === job.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter (optional)</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Briefly explain why you're a great fit..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => applyJob(job.id)} disabled={submitting} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                      {submitting ? 'Applying...' : 'Submit Application'}
                    </button>
                    <button onClick={() => setApplying(null)} className="px-4 py-1.5 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
