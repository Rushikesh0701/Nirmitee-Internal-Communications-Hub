import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import { Edit, Award, Star, Mail, Building, Briefcase } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { isAdmin } from '../../utils/userHelpers'
import RoleBadge from '../../components/RoleBadge'
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
  const canEdit = isOwnProfile || isAdmin(currentUser)

  const { data: profileData, isLoading, error, isError } = useQuery(
    ['profile', userId],
    () => api.get(`/users/profile/${userId}`),
    { 
      enabled: !!userId,
      retry: 1
    }
  )

  const updateMutation = useMutation(
    (data) => {
      // If admin is editing another user's profile, include targetUserId
      const updatePayload = canEdit && !isOwnProfile 
        ? { ...data, targetUserId: userId }
        : data
      return api.put('/users/profile/update', updatePayload)
    },
    {
      onSuccess: () => {
        toast.success('Profile updated successfully')
        queryClient.invalidateQueries(['profile', userId])
        setIsEditing(false)
        // If admin edited another user, also invalidate current user's profile
        if (!isOwnProfile) {
          queryClient.invalidateQueries(['profile', currentUser?._id || currentUser?.id])
        }
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to update profile')
      }
    }
  )
  
  // Initialize form data when entering edit mode
  useEffect(() => {
    if (isEditing && profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        displayName: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        department: profile.department || '',
        designation: profile.designation || profile.position || '',
        avatar: profile.avatar || '',
        role: profile.role || '',
        isActive: profile.isActive !== undefined ? profile.isActive : true
      })
    }
  }, [isEditing, profile])

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
    const roles = ['Admin', 'Moderator', 'Employee']
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">
          {isOwnProfile ? 'Edit Profile' : `Edit Profile - ${profile.name}`}
        </h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {isAdmin(currentUser) && !isOwnProfile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Admin Mode:</strong> You are editing another user's profile. All fields are editable.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={!isAdmin(currentUser) && !isOwnProfile}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={!isAdmin(currentUser) && !isOwnProfile}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={formData.displayName || ''}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={!isAdmin(currentUser) && !isOwnProfile}
            />
          </div>
          
          {isAdmin(currentUser) && (
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Designation</label>
            <input
              type="text"
              value={formData.designation || ''}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Avatar URL</label>
            <input
              type="text"
              value={formData.avatar || ''}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://..."
            />
          </div>
          
          {isAdmin(currentUser) && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role || profile.role || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value })
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Role</option>
                  {roles.map(roleName => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Admin:</strong> HR, management, or designated communicators | 
                  <strong> Moderator:</strong> Trusted employees for group moderation | 
                  <strong> Employee:</strong> All verified users
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== undefined ? formData.isActive : true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active User
                </label>
              </div>
            </>
          )}
          
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setFormData({})
              }}
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
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                {profile.role && (
                  <RoleBadge role={profile.role} size="md" />
                )}
              </div>
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
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit size={18} />
              {isOwnProfile ? 'Edit Profile' : 'Edit User Profile'}
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

