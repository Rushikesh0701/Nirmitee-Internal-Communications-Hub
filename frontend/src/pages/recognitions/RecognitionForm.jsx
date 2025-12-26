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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Send Recognition</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Recipient *</label>
          <select
            value={formData.receiverId}
            onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
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

        <div>
          <label className="block text-sm font-medium mb-2">Badge</label>
          <select
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
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
          <label className="block text-sm font-medium mb-2">Points</label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Write a message recognizing your colleague's contribution..."
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={sendMutation.isLoading}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {sendMutation.isLoading ? 'Sending...' : 'Send Recognition'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/recognitions')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

