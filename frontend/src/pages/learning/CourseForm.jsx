import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import Loading from '../../components/Loading'

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
      onSuccess: async () => {
        toast.success('Course created successfully')
        await queryClient.invalidateQueries('courses')
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
      onSuccess: async () => {
        toast.success('Course updated successfully')
        await queryClient.invalidateQueries('courses')
        await queryClient.invalidateQueries(['course', id])
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
    return <Loading fullScreen />
  }

  return (
    <div className="w-full space-y-6">
      <Link
        to="/learning"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Learning</span>
      </Link>

      <div className="card p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEdit ? 'Edit Course' : 'Create New Course'}
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
              placeholder="Enter course title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={5}
              className="input text-base py-2.5 resize-y"
              placeholder="Describe the course content and objectives"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty
              </label>
              <select {...register('difficulty')} className="input text-base py-2.5">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (hours)
              </label>
              <input
                type="number"
                {...register('duration')}
                className="input text-base py-2.5"
                placeholder="e.g., 10"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thumbnail URL
            </label>
            <input
              type="url"
              {...register('thumbnail')}
              className="input text-base py-2.5"
              placeholder="https://example.com/image.jpg"
            />
            {watch('thumbnail') && (
              <img
                src={watch('thumbnail')}
                alt="Preview"
                className="mt-3 w-full h-48 object-cover rounded-lg border border-slate-200"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn btn-primary flex items-center gap-2 px-6 py-2.5 text-base font-semibold"
            >
              <Save size={20} />
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : isEdit
                ? 'Update Course'
                : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="btn btn-secondary px-6 py-2.5 text-base font-semibold"
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

