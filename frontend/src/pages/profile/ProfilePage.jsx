import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { Edit, Award, Star, Mail, Building, User, Briefcase, Save, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { isAdmin } from '../../utils/userHelpers'
import RoleBadge from '../../components/RoleBadge'
import toast from 'react-hot-toast'
import Loading from '../../components/Loading'

export default function ProfilePage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  const userId = id || currentUser?._id || currentUser?.id
  const isOwnProfile = !id || id === currentUser?._id || id === currentUser?.id
  const canEdit = isOwnProfile || isAdmin(currentUser)

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
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
            <Edit size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{isOwnProfile ? 'Edit Profile' : `Edit - ${profile.name}`}</h1>
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
              <div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={formData.isActive !== undefined ? formData.isActive : true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-500" /><label htmlFor="isActive" className="text-sm text-slate-600">Active User</label></div>
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
    <motion.div className="max-w-4xl mx-auto space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full ring-4 ring-indigo-200" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center ring-4 ring-indigo-200">
                <span className="text-white font-semibold text-3xl">{profile.name?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-slate-800">{profile.name}</h1>
                {profile.role && <RoleBadge role={profile.role} size="md" />}
              </div>
              {profile.designation && <p className="text-lg text-slate-600 flex items-center gap-2"><Briefcase size={16} /> {profile.designation}</p>}
              {profile.department && <p className="text-slate-500 flex items-center gap-2 mt-1"><Building size={16} /> {profile.department}</p>}
            </div>
          </div>
          {canEdit && (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary flex items-center gap-2">
              <Edit size={18} /> {isOwnProfile ? 'Edit Profile' : 'Edit User'}
            </button>
          )}
        </div>

        {profile.bio && <div className="mb-6"><h2 className="text-lg font-semibold text-slate-800 mb-2">About</h2><p className="text-slate-600">{profile.bio}</p></div>}

        <div className="flex flex-wrap gap-6">
          {profile.email && <div className="flex items-center gap-2 text-slate-500"><Mail size={18} /> {profile.email}</div>}
          {profile.points > 0 && <div className="flex items-center gap-2 text-amber-500"><Star size={18} /> {profile.points} points</div>}
        </div>
      </motion.div>

      {profile.badges?.length > 0 && (
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2"><Award className="text-amber-500" size={24} /> Recognition Badges</h2>
          <div className="flex flex-wrap gap-2">{profile.badges.map((badge, index) => <span key={index} className="badge badge-warning">{badge}</span>)}</div>
        </motion.div>
      )}
    </motion.div>
  )
}
