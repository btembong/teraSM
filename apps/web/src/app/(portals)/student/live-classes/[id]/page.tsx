'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Radio, Clock, ArrowLeft, AlertCircle, Users } from 'lucide-react'

interface LiveClass {
  id: string
  title: string
  description: string | null
  status: string
  scheduledAt: string
  durationMins: number
  roomName: string
  _count?: { participants: number }
  courseOffering?: { course: { title: string } }
}

export default function StudentLiveClassRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [livekitUrl, setLivekitUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inRoom, setInRoom] = useState(false)

  useEffect(() => {
    fetch('/api/live-classes')
      .then((r) => r.json())
      .then((data: LiveClass[]) => {
        const cls = Array.isArray(data) ? data.find((c) => c.id === id) : null
        setLiveClass(cls ?? null)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load class details')
        setLoading(false)
      })
  }, [id])

  const joinClass = useCallback(async () => {
    setJoining(true)
    setError(null)
    try {
      const res = await fetch('/api/live-classes/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveClassId: id }),
      })
      if (!res.ok) throw new Error('Token request failed')
      const data = await res.json()
      setToken(data.token)
      setLivekitUrl(data.livekitUrl)
      setInRoom(true)
    } catch {
      setError('Unable to join class. Please try again.')
    } finally {
      setJoining(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!liveClass) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400 text-sm">Class not found.</div>
      </div>
    )
  }

  // In room — show LiveKit conference (student view, can subscribe but not publish by default)
  if (inRoom && token) {
    return (
      <div className="h-screen flex flex-col bg-gray-950">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-white font-medium text-sm">{liveClass.title}</span>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">LIVE</span>
          </div>
          <button
            onClick={() => { setInRoom(false); setToken(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Leave
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            video={true}
            audio={true}
            onDisconnected={() => { setInRoom(false); setToken(null) }}
            style={{ height: '100%' }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    SCHEDULED: 'text-blue-600 bg-blue-50',
    LIVE: 'text-blue-600 bg-blue-50',
    ENDED: 'text-gray-600 bg-gray-100',
    CANCELLED: 'text-gray-500 bg-gray-100',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{liveClass.title}</h1>
          {liveClass.courseOffering && (
            <p className="text-gray-500 text-sm">{liveClass.courseOffering.course.title}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Class info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[liveClass.status] ?? ''}`}>
            {liveClass.status}
          </span>
        </div>

        {liveClass.description && (
          <p className="text-gray-600 text-sm">{liveClass.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-medium">{new Date(liveClass.scheduledAt).toLocaleDateString()}</p>
              <p className="text-xs text-gray-400">
                {new Date(liveClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-medium">{liveClass.durationMins} minutes</p>
              <p className="text-xs text-gray-400">Duration</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-medium">{liveClass._count?.participants ?? 0}</p>
              <p className="text-xs text-gray-400">Participants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Join action */}
      {liveClass.status === 'LIVE' && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
            <h2 className="font-semibold text-gray-900">Class is live!</h2>
          </div>
          <button
            onClick={joinClass}
            disabled={joining}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            <Radio className="w-4 h-4" />
            {joining ? 'Joining...' : 'Join Live Class'}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            You'll join with audio and video. The teacher controls class recording.
          </p>
        </div>
      )}

      {liveClass.status === 'SCHEDULED' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center py-10">
          <Clock className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Class hasn't started yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Come back at {new Date(liveClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to join
          </p>
        </div>
      )}

      {liveClass.status === 'ENDED' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center py-10">
          <p className="text-gray-500">This class has ended.</p>
          {(liveClass._count?.participants ?? 0) > 0 && (
            <p className="text-sm text-gray-400 mt-2">Recording may be available — check with your teacher.</p>
          )}
        </div>
      )}

      {liveClass.status === 'CANCELLED' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center py-10">
          <p className="text-gray-500">This class has been cancelled.</p>
        </div>
      )}
    </div>
  )
}
