import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import { Edit, Award, Star, Mail, Building, Briefcase } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  // Handle both MongoDB _id and Sequelize id
  const userId = id || currentUser?._id || currentUser?.id
  const isOwnProfile = !id || id === currentUser?._id || id === currentUser?.id

  const { data: profileData, isLoading, error, isError } = useQuery(
    ['profile', userId],
    () => api.get(`/users/profile/${userId}`),
    { 
      enabled: !!userId,
      retry: 1
    }
  )

  const updateMutation = useMutation(
    (data) => api.put('/users/profile/update', data),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully')
        queryClient.invalidateQueries(['profile', userId])
        setIsEditing(false)
      },
      onError: () => {
        toast.error('Failed to update profile')
      }
    }
  )

  // Handle axios response structure: response.data = { success: true, data: profile }
  const profile = profileData?.data?.data

  if (isLoading) {
    return <div className="text-center py-12">Loading profile...</div>
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading profile</p>
        <p className="text-sm text-gray-500 mt-2">
          {error?.response?.data?.message || error?.message || 'Unknown error'}
        </p>
      </div>
    )
  }

  if (!profile) {
    return <div className="text-center py-12">Profile not found</div>
  }

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio || profile.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <input
              type="text"
              value={formData.department || profile.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Designation</label>
            <input
              type="text"
              value={formData.designation || profile.designation || ''}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-3xl">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              {profile.designation && (
                <p className="text-lg text-gray-600 mt-1">{profile.designation}</p>
              )}
              {profile.department && (
                <div className="flex items-center gap-2 text-gray-500 mt-2">
                  <Building size={16} />
                  {profile.department}
                </div>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit size={18} />
              Edit Profile
            </button>
          )}
        </div>

        {profile.bio && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={18} />
              <span className="text-sm">{profile.email}</span>
            </div>
          )}
          {profile.points > 0 && (
            <div className="flex items-center gap-2 text-yellow-600">
              <Star size={18} />
              <span className="text-sm font-medium">{profile.points} points</span>
            </div>
          )}
        </div>
      </div>

      {profile.badges && profile.badges.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={24} />
            Recognition Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

