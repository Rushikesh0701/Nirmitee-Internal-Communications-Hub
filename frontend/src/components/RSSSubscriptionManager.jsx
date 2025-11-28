import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, Mail, AlertCircle } from 'lucide-react'

const CATEGORIES = ['AI', 'Cloud', 'DevOps', 'Programming', 'Cybersecurity']

const RSSSubscriptionManager = () => {
  const queryClient = useQueryClient()
  const [selectedCategories, setSelectedCategories] = useState([])

  // Fetch current subscriptions
  const { data: subscriptions, isLoading } = useQuery(
    'rss-subscriptions',
    () => api.get('/rss/subscriptions').then((res) => res.data.data),
    {
      onSuccess: (data) => {
        setSelectedCategories(data || [])
      }
    }
  )

  // Update subscriptions mutation
  const updateMutation = useMutation(
    (categories) => api.put('/rss/subscriptions', { categories }),
    {
      onSuccess: () => {
        toast.success('Subscriptions updated successfully!')
        queryClient.invalidateQueries('rss-subscriptions')
        queryClient.invalidateQueries('rss-articles-grouped')
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to update subscriptions'
        toast.error(message)
      }
    }
  )

  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const handleSave = () => {
    if (selectedCategories.length < 3) {
      toast.error('Please select at least 3 categories')
      return
    }
    updateMutation.mutate(selectedCategories)
  }

  const selectedCount = selectedCategories.length
  const isValid = selectedCount >= 3

  if (isLoading) {
    return (
      <div className="card">
        <div className="text-center py-8">Loading subscriptions...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Mail className="text-blue-600" size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            RSS News Subscriptions
          </h2>
          <p className="text-gray-600">
            Select at least 3 categories to receive RSS news updates. You'll receive a daily digest email with the latest articles from your subscribed categories.
          </p>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`p-4 rounded-lg mb-6 ${
        isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="text-green-600" size={20} />
          ) : (
            <AlertCircle className="text-yellow-600" size={20} />
          )}
          <span className={`font-medium ${
            isValid ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {isValid
              ? `Great! You've selected ${selectedCount} categories.`
              : `Please select at least ${3 - selectedCount} more categor${3 - selectedCount === 1 ? 'y' : 'ies'}.`}
          </span>
        </div>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category)
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${
                  isSelected ? 'text-primary-700' : 'text-gray-700'
                }`}>
                  {category}
                </span>
                {isSelected && (
                  <CheckCircle2 className="text-primary-600" size={20} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Daily Digest Placeholder */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <Mail className="text-gray-500 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Daily Digest Email</h3>
            <p className="text-sm text-gray-600">
              You'll receive a daily email digest with the latest articles from your subscribed categories. 
              This feature will be enabled soon.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!isValid || updateMutation.isLoading}
          className={`btn ${
            isValid ? 'btn-primary' : 'btn-disabled'
          }`}
        >
          {updateMutation.isLoading ? 'Saving...' : 'Save Subscriptions'}
        </button>
      </div>
    </div>
  )
}

export default RSSSubscriptionManager

