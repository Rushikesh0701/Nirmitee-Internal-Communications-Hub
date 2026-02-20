import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { pollApi } from '../../services/pollApi'
import { BarChart3, Plus, Trash2, ArrowLeft } from 'lucide-react'

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
  { label: 'No expiry', value: null }
]

const PollForm = () => {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [expiryHours, setExpiryHours] = useState(24)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState('')

  const createMutation = useMutation(
    (data) => pollApi.createPoll(data),
    {
      onSuccess: () => {
        navigate('/polls')
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to create poll')
      }
    }
  )

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index, value) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options')
      return
    }

    const expiresAt = expiryHours
      ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
      : null

    createMutation.mutate({
      question: question.trim(),
      options: validOptions,
      expiresAt,
      isAnonymous
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/polls')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-h1 text-gray-900">Create Poll</h1>
          <p className="text-gray-600 mt-1">Get quick opinions from the team</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should we do for team lunch?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">{question.length}/500</p>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(min 2, max 10)</span>
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-400">{index + 1}</span>
                </div>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  maxLength={200}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Plus size={16} />
              Add option
            </button>
          )}
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Poll Duration
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setExpiryHours(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  expiryHours === opt.value
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Anonymous voting</p>
            <p className="text-xs text-gray-500">Voters won't be identified</p>
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
            onClick={() => navigate('/polls')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="btn-add"
          >
            <BarChart3 size={16} />
            {createMutation.isLoading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PollForm
