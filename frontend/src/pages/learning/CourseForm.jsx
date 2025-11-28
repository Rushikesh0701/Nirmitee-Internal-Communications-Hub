import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const CourseForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'Beginner',
      duration: '',
      thumbnail: ''
    }
  })

  // Load existing course if editing
  const { data: course, isLoading } = useQuery(
    ['course', id],
    () => api.get(`/learning/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (course) {
      setValue('title', course.title)
      setValue('description', course.description || '')
      setValue('difficulty', course.difficulty || 'Beginner')
      setValue('duration', course.duration || '')
      setValue('thumbnail', course.thumbnail || '')
    }
  }, [course, setValue])

  const createMutation = useMutation(
    (data) => api.post('/learning', data),
    {
      onSuccess: () => {
        toast.success('Course created successfully')
        queryClient.invalidateQueries('courses')
        navigate('/learning')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create course')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/learning/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Course updated successfully')
        queryClient.invalidateQueries('courses')
        queryClient.invalidateQueries(['course', id])
        navigate('/learning')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update course')
      }
    }
  )

  const onSubmit = (data) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      difficulty: data.difficulty,
      duration: data.duration ? parseInt(data.duration) : undefined,
      thumbnail: data.thumbnail || undefined
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
        to="/learning"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Learning
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Course' : 'Create New Course'}
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
              placeholder="Enter course title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={6}
              className="input"
              placeholder="Describe the course content and objectives"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select {...register('difficulty')} className="input">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                {...register('duration')}
                className="input"
                placeholder="e.g., 10"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail URL
            </label>
            <input
              type="url"
              {...register('thumbnail')}
              className="input"
              placeholder="https://example.com/image.jpg"
            />
            {watch('thumbnail') && (
              <img
                src={watch('thumbnail')}
                alt="Preview"
                className="mt-2 w-full h-48 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
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
                ? 'Update Course'
                : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/learning')}
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

export default CourseForm

