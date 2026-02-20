import { useState } from 'react'
import { useMutation } from 'react-query'
import { feedbackApi } from '../../services/feedbackApi'
import { MessageSquarePlus, Send, CheckCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { value: 'suggestion', label: '💡 Suggestion', desc: 'Ideas to improve the workplace' },
  { value: 'issue', label: '🐛 Issue', desc: 'Report a problem or concern' },
  { value: 'feedback', label: '💬 Feedback', desc: 'General feedback or thoughts' },
  { value: 'other', label: '📝 Other', desc: 'Anything else on your mind' }
]

const FeedbackSubmit = () => {
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitMutation = useMutation(
    (data) => feedbackApi.submitFeedback(data),
    {
      onSuccess: () => {
        setSubmitted(true)
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to submit feedback')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!category) {
      setError('Please select a category')
      return
    }
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!message.trim()) {
      setError('Please enter your feedback')
      return
    }

    submitMutation.mutate({
      category,
      title: title.trim(),
      message: message.trim(),
      isAnonymous
    })
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-h1 text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted {isAnonymous ? 'anonymously' : ''}. The admin team will review it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(false)
                setCategory('')
                setTitle('')
                setMessage('')
                setError('')
              }}
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              Submit another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-add"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-h1 text-gray-900">Suggestion Box</h1>
          <p className="text-gray-600 mt-1">Share your ideas, report issues, or give feedback</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  category === cat.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your feedback"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            maxLength={200}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Details <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide more details about your suggestion, issue, or feedback..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            maxLength={5000}
          />
          <p className="text-xs text-gray-400 mt-1">{message.length}/5000</p>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Submit anonymously</p>
            <p className="text-xs text-gray-500">Your identity will be hidden from reviewers</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isAnonymous ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isAnonymous ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitMutation.isLoading}
            className="btn-add"
          >
            <Send size={16} />
            {submitMutation.isLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FeedbackSubmit
