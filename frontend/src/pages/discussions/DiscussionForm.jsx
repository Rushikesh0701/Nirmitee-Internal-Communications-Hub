import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { isAdmin } from '../../utils/userHelpers'
import Loading from '../../components/Loading'

const DiscussionForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isEdit = !!id

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      title: '',
      content: '',
      category: 'General',
      tags: '',
      isPinned: false,
      isLocked: false
    }
  })

  // Load existing discussion if editing
  const { data: discussion, isLoading } = useQuery(
    ['discussion', id],
    () => api.get(`/discussions/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (discussion) {
      // Check permissions for editing
      if (isEdit) {
        const discussionAuthorId = discussion.authorId?._id || discussion.authorId || discussion.authorId?.toString();
        const userId = user?._id || user?.id;
        const isOwner = discussionAuthorId && userId && discussionAuthorId.toString() === userId.toString();
        const userIsAdmin = isAdmin(user);
        
        if (!isOwner && !userIsAdmin) {
          toast.error('You are not authorized to edit this discussion');
          navigate(`/discussions/${id}`);
          return;
        }
      }
      
      setValue('title', discussion.title)
      setValue('content', discussion.content)
      setValue('category', discussion.category || 'General')
      setValue('tags', discussion.tags?.join(', ') || '')
      setValue('isPinned', discussion.isPinned || false)
      setValue('isLocked', discussion.isLocked || false)
    }
  }, [discussion, setValue, isEdit, user, id, navigate])

  const createMutation = useMutation(
    (data) => api.post('/discussions', data),
    {
      onSuccess: async () => {
        toast.success('Discussion created successfully')
        await queryClient.invalidateQueries('discussions')
        navigate('/discussions')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create discussion')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/discussions/${id}`, data),
    {
      onSuccess: async () => {
        toast.success('Discussion updated successfully')
        await queryClient.invalidateQueries('discussions')
        await queryClient.invalidateQueries(['discussion', id])
        navigate('/discussions')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update discussion')
      }
    }
  )

  const onSubmit = (data) => {
    const payload = {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [],
      isPinned: data.isPinned,
      isLocked: data.isLocked
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="w-full space-y-6">
      <Link
        to="/discussions"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Discussions</span>
      </Link>

      <div className="card p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEdit ? 'Edit Discussion' : 'Start New Discussion'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input text-base py-2.5"
              placeholder="Enter discussion title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('content', { required: 'Content is required' })}
              rows={8}
              className="input text-base py-2.5 resize-y"
              placeholder="Share your thoughts..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select {...register('category')} className="input text-base py-2.5">
                <option value="General">General</option>
                <option value="Technical">Technical</option>
                <option value="Product">Product</option>
                <option value="Process">Process</option>
                <option value="Feedback">Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                {...register('tags')}
                className="input text-base py-2.5"
                placeholder="tag1, tag2, tag3"
              />
              <p className="mt-1 text-xs text-slate-500">
                Separate multiple tags with commas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                {...register('isPinned')}
                className="w-4 h-4 text-slate-700 border-gray-300 rounded focus:ring-slate-600"
              />
              <label htmlFor="isPinned" className="text-sm font-semibold text-gray-700">
                Pin discussion
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLocked"
                {...register('isLocked')}
                className="w-4 h-4 text-slate-700 border-gray-300 rounded focus:ring-slate-600"
              />
              <label htmlFor="isLocked" className="text-sm font-semibold text-gray-700">
                Lock discussion
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={20} />
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : isEdit
                ? 'Update Discussion'
                : 'Create Discussion'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/discussions')}
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

export default DiscussionForm

