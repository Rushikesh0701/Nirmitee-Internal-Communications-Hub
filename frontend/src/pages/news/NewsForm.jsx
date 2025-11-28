import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'

const NewsForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      imageUrl: '',
      category: 'General',
      priority: 'Normal',
      isPublished: false
    }
  })

  // Load existing news if editing
  const { data: news, isLoading } = useQuery(
    ['news', id],
    () => api.get(`/news/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (news) {
      setValue('title', news.title)
      setValue('summary', news.summary || '')
      setValue('content', news.content || '')
      setValue('imageUrl', news.imageUrl || '')
      setValue('category', news.category || 'General')
      setValue('priority', news.priority || 'Normal')
      setValue('isPublished', news.isPublished || false)
    }
  }, [news, setValue])

  const createMutation = useMutation(
    (data) => api.post('/news', data),
    {
      onSuccess: () => {
        toast.success('News created successfully')
        queryClient.invalidateQueries('news')
        navigate('/news')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create news')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/news/${id}`, data),
    {
      onSuccess: () => {
        toast.success('News updated successfully')
        queryClient.invalidateQueries('news')
        queryClient.invalidateQueries(['news', id])
        navigate('/news')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update news')
      }
    }
  )

  const onSubmit = (data) => {
    const payload = {
      title: data.title,
      summary: data.summary || undefined,
      content: data.content || undefined,
      imageUrl: data.imageUrl || undefined,
      category: data.category,
      priority: data.priority,
      isPublished: data.isPublished
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/news"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to News
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit News' : 'Create New News'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input"
              placeholder="Enter news title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              {...register('summary')}
              rows={3}
              className="input"
              placeholder="Brief summary of the news"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              {...register('content')}
              rows={10}
              className="input"
              placeholder="Full news content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              {...register('imageUrl')}
              className="input"
              placeholder="https://example.com/image.jpg"
            />
            {watch('imageUrl') && (
              <img
                src={watch('imageUrl')}
                alt="Preview"
                className="mt-2 w-full h-48 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select {...register('category')} className="input">
                <option value="General">General</option>
                <option value="Company">Company</option>
                <option value="Product">Product</option>
                <option value="Team">Team</option>
                <option value="Event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select {...register('priority')} className="input">
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              {...register('isPublished')}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : isEdit
                ? 'Update News'
                : 'Create News'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/news')}
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

export default NewsForm

