import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import userAPI from '../../services/userApi'
import { Edit, Award, Star, Mail, Building, User, Briefcase, Save, X, Trash2, AlertTriangle, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { isAdmin } from '../../utils/userHelpers'
import RoleBadge from '../../components/RoleBadge'
import toast from 'react-hot-toast'
import { useTheme } from '../../contexts/ThemeContext'
import EmptyState from '../../components/EmptyState'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const { theme } = useTheme()
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

  // Use skeleton loader instead of full-page loader
  if (isLoading && !profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className={`h-32 rounded-lg ${
          theme === 'dark' ? 'bg-[#151a28]' : 'bg-slate-200'
        }`} />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-4 rounded ${
              theme === 'dark' ? 'bg-[#151a28]' : 'bg-slate-200'
            } ${i === 5 ? 'w-3/4' : 'w-full'}`} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state">
        <User size={56} className="empty-state-icon" />
        <h3 className="empty-state-title text-rose-500">Error loading profile</h3>
        <p className="empty-state-text">{error?.response?.data?.message || 'Unknown error'}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Profile not found"
        message="The profile you're looking for doesn't exist"
      />
    )
  }

  if (isEditing) {
    const roles = ['Admin', 'Moderator', 'Employee']
    
    return (
      <motion.div className="w-full space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff4701] to-[#ff5500]">
            <Edit size={18} className="text-white" />
          </div>
          <h1 className="text-h2 text-slate-800">
            {isOwnProfile ? 'Edit Profile' : `Edit - ${profile.firstName && profile.lastName 
              ? `${profile.firstName} ${profile.lastName}`.trim()
              : profile.name || profile.displayName || 'User'}`}
          </h1>
        </div>

        <div className="card p-4 space-y-3">
          {isAdmin(currentUser) && !isOwnProfile && (
            <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
              <p className="text-overline text-amber-800 font-medium"><strong>Admin Mode:</strong> Editing another user's profile</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">First Name</label>
              <input type="text" value={formData.firstName || ''} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input text-caption py-1.5 px-3" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Last Name</label>
              <input type="text" value={formData.lastName || ''} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input text-caption py-1.5 px-3" />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Display Name</label>
            <input type="text" value={formData.displayName || ''} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="input text-caption py-1.5 px-3" />
          </div>
          
          {isAdmin(currentUser) && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Email</label>
              <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input text-caption py-1.5 px-3" />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Bio</label>
            <textarea value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3} className="textarea text-caption py-1.5 px-3" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Department</label>
              <input type="text" value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input text-caption py-1.5 px-3" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Designation</label>
              <input type="text" value={formData.designation || ''} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="input text-caption py-1.5 px-3" />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Avatar URL</label>
            <input type="text" value={formData.avatar || ''} onChange={(e) => setFormData({ ...formData, avatar: e.target.value })} className="input text-caption py-1.5 px-3" placeholder="https://..." />
          </div>
          
          {isAdmin(currentUser) && (
            <>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Role</label>
                <select value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-select text-caption py-1.5 px-3">
                  <option value="">Select Role</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <input type="checkbox" id="isActive" checked={formData.isActive !== undefined ? formData.isActive : true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-[#ff4701] focus:ring-2 focus:ring-[#ff4701]/20" />
                <label htmlFor="isActive" className="text-overline text-slate-700 cursor-pointer">Active User</label>
              </div>
            </>
          )}
          
          <div className="flex gap-2 pt-1">
            <button onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isLoading} className="btn btn-primary flex items-center gap-2 px-3 py-2 text-caption">
              <Save size={14} /> {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => { setIsEditing(false); setFormData({}); }} className="btn btn-secondary flex items-center gap-2 px-3 py-2 text-caption">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="w-full space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Main Profile Card */}
      <motion.div 
        className="card p-5 overflow-hidden relative" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Gradient Background Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff4701] via-[#ff5500] to-[#ff4701]" />
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Modern Avatar with Gradient Border */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff4701] to-[#ff5500] opacity-20 blur-sm" />
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="relative w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-200" 
                />
              ) : (
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff4701] to-[#ff5500] flex items-center justify-center ring-2 ring-slate-200">
                  <span className="text-white font-bold text-xl">
                    {profile.firstName && profile.lastName
                      ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
                      : ((profile.firstName && profile.firstName.charAt(0)) || profile.name?.charAt(0) || 'U').toUpperCase()}
                  </span>
                </div>
              )}
              {profile.isActive !== false && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <h1 className="text-h1 text-slate-800">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`.trim()
                    : profile.name || profile.displayName || 'User'}
                </h1>
                {profile.role && <RoleBadge role={profile.role} size="sm" />}
              </div>
              
              {profile.designation && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-100">
                    <Briefcase size={12} className="text-slate-600" />
                  </div>
                  <p className="text-button text-slate-700">{profile.designation}</p>
                </div>
              )}
              
              {profile.department && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-100">
                    <Building size={12} className="text-slate-600" />
                  </div>
                  <p className="text-overline text-slate-600">{profile.department}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            {canEdit && (
              <motion.button 
                onClick={() => setIsEditing(true)} 
                className="btn btn-primary flex items-center gap-2 px-3 py-2 text-caption"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit size={16} /> {isOwnProfile ? 'Edit' : 'Edit User'}
              </motion.button>
            )}
            {canDelete && (
              <motion.button
                onClick={handleDeleteClick}
                disabled={permanentDeleteMutation.isLoading}
                className="btn bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 px-3 py-2 text-caption disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 size={16} /> Delete
              </motion.button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
            <h2 className="text-overline font-bold uppercase tracking-wide text-slate-600 mb-2">About</h2>
            <p className="text-caption text-slate-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {profile.email && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Mail size={14} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-overline text-slate-500 mb-0.5">Email</p>
                <p className="text-overline text-slate-700 truncate">{profile.email}</p>
              </div>
            </div>
          )}
          {profile.points > 0 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                <Star size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-overline text-slate-500 mb-0.5">Points</p>
                <p className="text-overline font-bold text-amber-700">{profile.points.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Badges Section */}
      {profile.badges?.length > 0 && (
        <motion.div 
          className="card p-5" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
              <Award size={18} className="text-purple-600" />
            </div>
            <h2 className="text-caption font-bold text-slate-800">Recognition Badges</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge, index) => (
              <motion.span 
                key={index} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-overline bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <Sparkles size={12} />
                {badge}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-red-100">
                  <AlertTriangle size={24} className="text-rose-600" />
                </div>
                <h3 className="text-h2 text-slate-900">Delete User</h3>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to <span className="font-bold text-rose-600">permanently delete</span>{' '}
                <span className="font-semibold text-slate-900">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`.trim()
                    : profile.name || profile.displayName || 'User'}
                </span>?
              </p>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 mb-6">
                <p className="text-button text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  This action cannot be undone!
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={permanentDeleteMutation.isLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
