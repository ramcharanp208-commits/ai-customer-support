import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Send, Sparkles, ArrowLeft } from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import { PriorityBadge, CategoryBadge } from '../components/StatusBadge'
import type { AIAnalysisResult } from '../types'
import client from '../api/client'

export default function NewTicketPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState<AIAnalysisResult | null>(null)

  // Real-time AI preview as user types
  const handleAnalyze = async () => {
    if (description.length < 10) return
    setAnalyzing(true)
    try {
      const { data } = await client.post<AIAnalysisResult>('/ai/analyze', { description })
      setPreview(data)
    } catch {
      // silent — preview is optional
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const ticket = await ticketsApi.create({ title, description })
      toast.success('Ticket submitted! AI has analysed your request.')
      navigate(`/tickets/${ticket.id}`)
    } catch {
      toast.error('Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Support Request</h1>
        <p className="text-gray-500 text-sm mt-1">Our AI will instantly classify and prioritise your ticket.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="title">Title <span className="text-red-500">*</span></label>
            <input
              id="title"
              type="text"
              className="input"
              placeholder="Brief summary of your issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
              maxLength={255}
            />
          </div>

          <div>
            <label className="label" htmlFor="description">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              className="input min-h-[140px] resize-y"
              placeholder="Describe your issue in detail. The more context you provide, the faster we can help."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleAnalyze}
              required
              minLength={10}
            />
            <p className="mt-1 text-xs text-gray-400">{description.length} characters</p>
          </div>

          {/* AI preview panel */}
          {(analyzing || preview) && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-brand-600" />
                <span className="text-sm font-semibold text-brand-700">AI Analysis Preview</span>
                {analyzing && <span className="text-xs text-brand-500 animate-pulse">Analysing…</span>}
              </div>
              {preview && !analyzing && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <CategoryBadge category={preview.category} />
                    <PriorityBadge priority={preview.priority} />
                    <span className={`badge ${preview.sentiment === 'negative' ? 'bg-red-100 text-red-600' : preview.sentiment === 'positive' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {preview.sentiment} sentiment
                    </span>
                    <span className="badge bg-white border border-brand-200 text-brand-600">
                      {Math.round(preview.confidence * 100)}% confidence
                    </span>
                  </div>
                  {preview.summary && (
                    <p className="text-xs text-gray-600"><strong>Summary:</strong> {preview.summary}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              <Send size={16} />
              {loading ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
