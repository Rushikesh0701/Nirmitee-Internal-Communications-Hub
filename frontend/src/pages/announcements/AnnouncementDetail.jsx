import { useQuery, useMutation, useQueryClient } from 'react-query'
import { memo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Calendar, User, Clock, Tag, Edit, Trash2, Megaphone } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { isAdmin } from '../../utils/userHelpers'
import { DetailSkeleton } from '../../components/skeletons'
import EmptyState from '../../components/EmptyState'

const AnnouncementDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const userIsAdmin = isAdmin(user)

  const { data: announcement, isLoading } = useQuery(
    ['announcement', id],
    () => api.get(`/announcements/${id}`).then((res) => res.data.data),
    { enabled: !!id }
  )

  const deleteMutation = useMutation(
    () => api.delete(`/announcements/${id}`),
    {
      onSuccess: async () => {
        toast.success('Announcement deleted successfully')
        await queryClient.invalidateQueries(['announcements'])
        navigate('/announcements')
      },
      onError: () => {
        toast.error('Failed to delete announcement')
      }
    }
  )

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (!announcement) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Announcement not found"
        message="The announcement you're looking for doesn't exist or has been removed"
      />
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back to Announcements</span>
        </Link>
        {userIsAdmin && (
          <div className="flex items-center gap-2">
            <Link
              to={`/announcements/${id}/edit`}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Edit size={18} />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        )}
      </div>

      <article className="card p-6 lg:p-8">
        {announcement.image && (
          <img
            src={announcement.image}
            alt={announcement.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="space-y-4">
          {announcement.tags && announcement.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {announcement.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded bg-primary-100 text-primary-800"
                >
                  <Tag size={14} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{announcement.title}</h1>

          <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>
                {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
              </span>
            </div>
            {announcement.scheduledAt ? (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{format(new Date(announcement.scheduledAt), 'MMMM d, yyyy')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{format(new Date(announcement.createdAt), 'MMMM d, yyyy')}</span>
              </div>
            )}
            {announcement.scheduledAt && !announcement.isPublished && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                Scheduled
              </span>
            )}
          </div>

          <div className="prose max-w-none pt-4 border-t">
            <div
              className="text-gray-700"
              dangerouslySetInnerHTML={{ __html: announcement.content }}
            />
          </div>
        </div>
      </article>
    </div>
  )
}

export default memo(AnnouncementDetail)

