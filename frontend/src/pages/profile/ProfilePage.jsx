import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import userAPI from '../../services/userApi'
import { Edit, Award, Star, Mail, Building, User, Briefcase, Save, X, Trash2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { isAdmin } from '../../utils/userHelpers'
import RoleBadge from '../../components/RoleBadge'
import toast from 'react-hot-toast'
import Loading from '../../components/Loading'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const userId = id || currentUser?._id || currentUser?.id
  const isOwnProfile = !id || id === currentUser?._id || id === currentUser?.id
  const canEdit = isOwnProfile || isAdmin(currentUser)
  const canDelete = !isOwnProfile && isAdmin(currentUser)

  const { data: profileData, isLoading, error, isError } = useQuery(['profile', userId], () => api.get(`/users/profile/${userId}`), { enabled: !!userId, retry: 1 })
  const profile = profileData?.data?.data

  const updateMutation = useMutation(
    (data) => {
      const updatePayload = canEdit && !isOwnProfile ? { ...data, targetUserId: userId } : data
      return api.put('/users/profile/update', updatePayload)
    },
    {
      onSuccess: () => { toast.success('Profile updated!'); queryClient.invalidateQueries(['profile', userId]); setIsEditing(false); if (!isOwnProfile) queryClient.invalidateQueries(['profile', currentUser?._id || currentUser?.id]); },
      onError: (error) => toast.error(error?.response?.data?.message || 'Failed to update')
    }
  )

  // Permanent delete mutation (hard delete)
  const permanentDeleteMutation = useMutation(
    (userId) => userAPI.permanentDelete(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile'])
        setShowDeleteDialog(false)
        toast.success('User permanently deleted')
        // Redirect to directory after deletion
        setTimeout(() => navigate('/directory'), 500)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user')
      }
    }
  )

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    permanentDeleteMutation.mutate(userId)
  }
  
  useEffect(() => {
    if (isEditing && profile) {
      setFormData({
        firstName: profile.firstName || '', lastName: profile.lastName || '', displayName: profile.name || '',
        email: profile.email || '', bio: profile.bio || '', department: profile.department || '',
        designation: profile.designation || profile.position || '', avatar: profile.avatar || '',
        role: profile.role || '', isActive: profile.isActive !== undefined ? profile.isActive : true
      })
    }
  }, [isEditing, profile])

  if (isLoading && !profile) return <Loading fullScreen size="lg" text="Loading profile..." />

  if (isError) {
    return (
      <div className="empty-state">
        <User size={56} className="empty-state-icon" />
        <h3 className="empty-state-title text-rose-500">Error loading profile</h3>
        <p className="empty-state-text">{error?.response?.data?.message || 'Unknown error'}</p>
      </div>
    )
  }

  if (!profile) return <div className="empty-state"><User size={56} className="empty-state-icon" /><h3 className="empty-state-title">Profile not found</h3></div>

  if (isEditing) {
    const roles = ['Admin', 'Moderator', 'Employee']
    
    return (
      <motion.div className="max-w-2xl mx-auto space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600">
            <Edit size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isOwnProfile ? 'Edit Profile' : `Edit - ${profile.firstName && profile.lastName 
              ? `${profile.firstName} ${profile.lastName}`.trim()
              : profile.name || profile.displayName || 'User'}`}
          </h1>
        </div>

        <div className="card space-y-4">
          {isAdmin(currentUser) && !isOwnProfile && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700"><strong>Admin Mode:</strong> Editing another user's profile</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">First Name</label><input type="text" value={formData.firstName || ''} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input" /></div>
            <div><label className="form-label">Last Name</label><input type="text" value={formData.lastName || ''} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input" /></div>
          </div>
          
          <div><label className="form-label">Display Name</label><input type="text" value={formData.displayName || ''} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="input" /></div>
          
          {isAdmin(currentUser) && <div><label className="form-label">Email</label><input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input" /></div>}
          
          <div><label className="form-label">Bio</label><textarea value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} className="textarea" /></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Department</label><input type="text" value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input" /></div>
            <div><label className="form-label">Designation</label><input type="text" value={formData.designation || ''} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="input" /></div>
          </div>
          
          <div><label className="form-label">Avatar URL</label><input type="text" value={formData.avatar || ''} onChange={(e) => setFormData({ ...formData, avatar: e.target.value })} className="input" placeholder="https://..." /></div>
          
          {isAdmin(currentUser) && (
            <>
              <div><label className="form-label">Role</label><select value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-select"><option value="">Select Role</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={formData.isActive !== undefined ? formData.isActive : true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" /><label htmlFor="isActive" className="text-sm text-slate-600">Active User</label></div>
            </>
          )}
          
          <div className="flex gap-3 pt-4">
            <button onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isLoading} className="btn btn-primary flex items-center gap-2"><Save size={18} /> {updateMutation.isLoading ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { setIsEditing(false); setFormData({}); }} className="btn btn-secondary flex items-center gap-2"><X size={18} /> Cancel</button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="max-w-4xl mx-auto space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-full ring-2 ring-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-slate-200">
                <span className="text-white font-semibold text-lg">
                  {profile.firstName && profile.lastName
                    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
                    : ((profile.firstName && profile.firstName.charAt(0)) || profile.name?.charAt(0) || 'U').toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-bold text-slate-800">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`.trim()
                    : profile.name || profile.displayName || 'User'}
                </h1>
                {profile.role && <RoleBadge role={profile.role} size="sm" />}
              </div>
              {profile.designation && <p className="text-sm text-slate-600 flex items-center gap-1.5"><Briefcase size={14} /> {profile.designation}</p>}
              {profile.department && <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Building size={14} /> {profile.department}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button onClick={() => setIsEditing(true)} className="btn btn-primary flex items-center gap-2">
                <Edit size={18} /> {isOwnProfile ? 'Edit Profile' : 'Edit User'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={softDeleteMutation.isLoading}
                className="btn bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} /> Delete User
              </button>
            )}
          </div>
        </div>

        {profile.bio && <div className="mb-4"><h2 className="text-sm font-semibold text-slate-800 mb-1">About</h2><p className="text-sm text-slate-600">{profile.bio}</p></div>}

        <div className="flex flex-wrap gap-4">
          {profile.email && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail size={14} /> {profile.email}</div>}
          {profile.points > 0 && <div className="flex items-center gap-1.5 text-xs text-blue-600"><Star size={14} /> {profile.points} points</div>}
        </div>
      </motion.div>

      {profile.badges?.length > 0 && (
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><Award className="text-blue-600" size={18} /> Recognition Badges</h2>
          <div className="flex flex-wrap gap-2">{profile.badges.map((badge, index) => <span key={index} className="badge badge-primary text-xs">{badge}</span>)}</div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-lg max-w-md w-full p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-full bg-rose-100">
                  <AlertTriangle size={24} className="text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to <span className="font-semibold text-rose-600">permanently delete</span> <span className="font-semibold">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`.trim()
                    : profile.name || profile.displayName || 'User'}
                </span>?
                <br />
                <span className="text-sm text-rose-500 mt-2 block font-medium">
                  ⚠️ This action cannot be undone!
                </span>
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={permanentDeleteMutation.isLoading}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {permanentDeleteMutation.isLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
