'use client'

import { useState } from 'react'
import { Bot, Send, Sparkles, BookOpen, AlertTriangle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function StudentAIPage() {
  const [tab, setTab] = useState<'chat' | 'advisor' | 'essay'>('chat')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Tera AI. I can help you with academic questions, platform navigation, and school-related queries. What can I help you with today?' }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [advisorData, setAdvisorData] = useState<{ advice: string; cgpa: string; enrolledCount: number } | null>(null)
  const [advisorLoading, setAdvisorLoading] = useState(false)
  const [essayText, setEssayText] = useState('')
  const [essayTitle, setEssayTitle] = useState('')
  const [essayFeedback, setEssayFeedback] = useState('')
  const [essayLoading, setEssayLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSending(true)

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let assistantContent = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
          return updated
        })
      }
    }
    setSending(false)
  }

  const getAdvisorAdvice = async () => {
    setAdvisorLoading(true)
    const res = await fetch('/api/ai/advisor')
    const data = await res.json()
    setAdvisorData(data)
    setAdvisorLoading(false)
  }

  const getEssayFeedback = async () => {
    if (!essayText.trim()) return
    setEssayLoading(true)
    const res = await fetch('/api/ai/essay-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: essayText, assignmentTitle: essayTitle }),
    })
    const data = await res.json()
    setEssayFeedback(data.feedback || data.error)
    setEssayLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500">Powered by Claude — your academic AI companion</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'chat', label: 'AI Chat', icon: Bot },
          { key: 'advisor', label: 'Academic Advisor', icon: Sparkles },
          { key: 'essay', label: 'Essay Feedback', icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col" style={{ height: '60vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                  {msg.content || <span className="animate-pulse">▋</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask anything about your studies..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'advisor' && (
        <div className="space-y-4">
          {!advisorData ? (
            <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
              <Sparkles className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <p className="font-medium text-gray-900 mb-2">Get Personalized Academic Advice</p>
              <p className="text-gray-400 text-sm mb-6">AI will analyze your grades, courses, and progress to give tailored recommendations</p>
              <button
                onClick={getAdvisorAdvice}
                disabled={advisorLoading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {advisorLoading ? 'Analyzing your profile...' : 'Get My Advice'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-500">Your Average</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{advisorData.cgpa}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-500">Active Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{advisorData.enrolledCount}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Your Personalized Advice</h3>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{advisorData.advice}</div>
              </div>
              <button onClick={() => setAdvisorData(null)} className="text-sm text-blue-600 hover:underline">Refresh advice</button>
            </div>
          )}
        </div>
      )}

      {tab === 'essay' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title (optional)</label>
              <input
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Causes of World War I"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Essay / Text</label>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Paste your essay or assignment text here (minimum 50 characters)..."
              />
              <p className="text-xs text-gray-400 mt-1">{essayText.length} characters</p>
            </div>
            <button
              onClick={getEssayFeedback}
              disabled={essayLoading || essayText.trim().length < 50}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {essayLoading ? 'Analyzing...' : 'Get AI Feedback'}
            </button>
          </div>

          {essayFeedback && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI Feedback</h3>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{essayFeedback}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
