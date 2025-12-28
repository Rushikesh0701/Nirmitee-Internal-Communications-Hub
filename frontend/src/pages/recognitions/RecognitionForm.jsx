import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import api from '../../services/api'
import toast from 'react-hot-toast'
import EmptyState from '../../components/EmptyState'
import { Users } from 'lucide-react'

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
    <div className="w-full space-y-3">
      <h1 className="text-xl font-bold text-slate-800 mb-3">Send Recognition</h1>
      
      <div className="card p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">Recipient <span className="text-red-500">*</span></label>
            {usersData?.users && usersData.users.length > 0 ? (
              <select
                value={formData.receiverId}
                onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
                className="input text-sm py-2"
                required
              >
                <option value="">Select a colleague</option>
                {usersData.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.department || 'No department'}
                  </option>
                ))}
              </select>
            ) : (
              <EmptyState
                icon={Users}
                title="No users available"
                message="Unable to load user directory"
                compact
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">Badge</label>
              <select
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="input text-sm py-2"
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
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">Points</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="input text-sm py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">Message <span className="text-red-500">*</span></label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              className="input text-sm py-2 resize-y"
              placeholder="Write a message recognizing your colleague's contribution..."
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-[#151a28]">
            <button
              type="submit"
              disabled={sendMutation.isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              {sendMutation.isLoading ? 'Sending...' : 'Send Recognition'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/recognitions')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

