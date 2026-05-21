'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface Content {
  id: string
  title: string
  type: string
  url: string
  description?: string
  isPublished: boolean
  order: number
}

interface Assignment {
  id: string
  title: string
  dueDate: string
  maxScore: number
  isPublished: boolean
  _count: { submissions: number }
}

const CONTENT_TYPES = ['PDF', 'VIDEO', 'LINK', 'DOCUMENT', 'IMAGE', 'AUDIO']

export default function StaffLmsPage() {
  const params = useParams()
  const offeringId = params.offeringId as string

  const [contents, setContents] = useState<Content[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tab, setTab] = useState<'content' | 'assignments'>('content')

  // New content form
  const [showContentForm, setShowContentForm] = useState(false)
  const [newContent, setNewContent] = useState({ title: '', type: 'PDF', url: '', description: '' })

  // New assignment form
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', maxScore: 100, dueDate: '', allowLate: false,
  })

  const [saving, setSaving] = useState(false)

  const reload = async () => {
    const [c, a] = await Promise.all([
      fetch(`/api/lms/content?courseOfferingId=${offeringId}`).then((r) => r.json()),
      fetch(`/api/lms/assignments?courseOfferingId=${offeringId}`).then((r) => r.json()),
    ])
    setContents(c)
    setAssignments(a)
  }

  useEffect(() => { reload() }, [offeringId])

  const addContent = async () => {
    setSaving(true)
    await fetch('/api/lms/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseOfferingId: offeringId, ...newContent }),
    })
    setNewContent({ title: '', type: 'PDF', url: '', description: '' })
    setShowContentForm(false)
    await reload()
    setSaving(false)
  }

  const togglePublishContent = async (id: string, current: boolean) => {
    await fetch(`/api/lms/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    await reload()
  }

  const addAssignment = async () => {
    setSaving(true)
    await fetch('/api/lms/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseOfferingId: offeringId, ...newAssignment }),
    })
    setNewAssignment({ title: '', description: '', maxScore: 100, dueDate: '', allowLate: false })
    setShowAssignmentForm(false)
    await reload()
    setSaving(false)
  }

  const togglePublishAssignment = async (id: string, current: boolean) => {
    await fetch(`/api/lms/assignments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    await reload()
  }

  const contentTypeColor: Record<string, string> = {
    PDF: 'bg-blue-50 text-blue-600', VIDEO: 'bg-blue-100 text-blue-700',
    LINK: 'bg-blue-50 text-blue-600', DOCUMENT: 'bg-gray-100 text-gray-600',
    IMAGE: 'bg-blue-50 text-blue-600', AUDIO: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/staff" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Manage LMS Content</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('content')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'content' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Course Materials ({contents.length})
        </button>
        <button
          onClick={() => setTab('assignments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'assignments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Assignments ({assignments.length})
        </button>
      </div>

      {/* Content Tab */}
      {tab === 'content' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowContentForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>

          {showContentForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Add Course Material</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Title"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newContent.type}
                  onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input
                  placeholder="URL / Link"
                  value={newContent.url}
                  onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                />
                <input
                  placeholder="Description (optional)"
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addContent}
                  disabled={saving || !newContent.title || !newContent.url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Add Material'}
                </button>
                <button
                  onClick={() => setShowContentForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {contents.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No materials yet. Click "Add Material" to get started.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {contents.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${contentTypeColor[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.type}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.title}</p>
                        {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                      <button
                        onClick={() => togglePublishContent(c.id, c.isPublished)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title={c.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {c.isPublished
                          ? <Eye className="w-4 h-4 text-blue-500" />
                          : <EyeOff className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAssignmentForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Assignment
            </button>
          </div>

          {showAssignmentForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Add Assignment</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                />
                <input
                  placeholder="Description (optional)"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Max Score</label>
                  <input
                    type="number"
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAssignment.allowLate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, allowLate: e.target.checked })}
                    className="rounded"
                  />
                  Allow late submissions
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addAssignment}
                  disabled={saving || !newAssignment.title || !newAssignment.dueDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Add Assignment'}
                </button>
                <button
                  onClick={() => setShowAssignmentForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {assignments.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No assignments yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assignments.map((a) => {
                  const isOverdue = new Date(a.dueDate) < new Date()
                  return (
                    <div key={a.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.title}</p>
                        <p className={`text-xs ${isOverdue ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          Due {new Date(a.dueDate).toLocaleString()} · {a.maxScore} pts · {a._count.submissions} submissions
                        </p>
                      </div>
                      <button
                        onClick={() => togglePublishAssignment(a.id, a.isPublished)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title={a.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {a.isPublished
                          ? <Eye className="w-4 h-4 text-blue-500" />
                          : <EyeOff className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
