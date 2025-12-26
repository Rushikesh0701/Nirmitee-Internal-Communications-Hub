import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import api from '../../services/api'
import toast from 'react-hot-toast'

const BADGES = [
  'Team Player',
  'Innovator',
  'Leader',
  'Problem Solver',
  'Customer Champion',
  'Mentor',
  'Excellence',
  'Going Above & Beyond'
]

export default function RecognitionForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    receiverId: '',
    message: '',
    badge: '',
    points: 0
  })

  // Fetch users for dropdown
  const { data: usersData } = useQuery('users', () => api.get('/users/directory').then((res) => res.data.data))

  const sendMutation = useMutation(recognitionRewardApi.sendRecognition, {
    onSuccess: async () => {
      toast.success('Recognition sent successfully!')
      await queryClient.invalidateQueries('recognitionFeed')
      navigate('/recognitions')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send recognition')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.receiverId || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }
    sendMutation.mutate(formData)
  }

  return (
    <div className="w-full space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Send Recognition</h1>
      
      <div className="card p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient <span className="text-red-500">*</span></label>
            <select
              value={formData.receiverId}
              onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
              className="input text-base py-2.5"
              required
            >
              <option value="">Select a colleague</option>
              {usersData?.users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.department || 'No department'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Badge</label>
              <select
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="input text-base py-2.5"
              >
                <option value="">No badge</option>
                {BADGES.map((badge) => (
                  <option key={badge} value={badge}>
                    {badge}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="input text-base py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              className="input text-base py-2.5 resize-y"
              placeholder="Write a message recognizing your colleague's contribution..."
              required
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={sendMutation.isLoading}
              className="btn btn-primary flex items-center gap-2 px-6 py-2.5 text-base font-semibold"
            >
              {sendMutation.isLoading ? 'Sending...' : 'Send Recognition'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/recognitions')}
              className="btn btn-secondary px-6 py-2.5 text-base font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

