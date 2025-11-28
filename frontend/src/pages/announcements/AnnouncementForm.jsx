import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

// Simple rich text editor component
// Note: For production, consider using react-quill or similar library
const RichTextEditor = ({ value, onChange }) => {
  const [content, setContent] = useState(value || '')

  useEffect(() => {
    setContent(value || '')
  }, [value])

  const handleChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    onChange(newContent)
  }

  const insertTag = (tag) => {
    const textarea = document.getElementById('content-editor')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const before = content.substring(0, start)
    const after = content.substring(end)
    
    let replacement = ''
    switch(tag) {
      case 'bold':
        replacement = `<strong>${selectedText || 'bold text'}</strong>`
        break
      case 'italic':
        replacement = `<em>${selectedText || 'italic text'}</em>`
        break
      case 'ul':
        replacement = `<ul>\n<li>${selectedText || 'list item'}</li>\n</ul>`
        break
      case 'ol':
        replacement = `<ol>\n<li>${selectedText || 'list item'}</li>\n</ol>`
        break
      case 'link':
        replacement = `<a href="${selectedText || 'https://example.com'}">${selectedText || 'link text'}</a>`
        break
      default:
        replacement = selectedText
    }
    
    const newContent = before + replacement + after
    setContent(newContent)
    onChange(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border">
        <button
          type="button"
          onClick={() => insertTag('bold')}
          className="px-3 py-1 text-sm font-bold bg-white rounded hover:bg-gray-200"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertTag('italic')}
          className="px-3 py-1 text-sm italic bg-white rounded hover:bg-gray-200"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertTag('ul')}
          className="px-3 py-1 text-sm bg-white rounded hover:bg-gray-200"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertTag('ol')}
          className="px-3 py-1 text-sm bg-white rounded hover:bg-gray-200"
          title="Numbered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => insertTag('link')}
          className="px-3 py-1 text-sm bg-white rounded hover:bg-gray-200"
          title="Link"
        >
          🔗
        </button>
      </div>
      <textarea
        id="content-editor"
        value={content}
        onChange={handleChange}
        rows={15}
        className="input font-mono text-sm"
        placeholder="Enter announcement content. Use HTML tags for formatting."
      />
      <p className="text-xs text-gray-500">
        Tip: You can use HTML tags like &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;a&gt; for formatting
      </p>
    </div>
  )
}

const AnnouncementForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      content: '',
      image: '',
      tags: '',
      scheduledAt: ''
    }
  })

  const scheduledAt = watch('scheduledAt')

  // Load existing announcement if editing
  const { data: announcement, isLoading } = useQuery(
    ['announcement', id],
    () => api.get(`/announcements/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (announcement) {
      setValue('title', announcement.title)
      setValue('content', announcement.content)
      setValue('image', announcement.image || '')
      setValue('tags', announcement.tags?.join(', ') || '')
      setValue('scheduledAt', announcement.scheduledAt ? new Date(announcement.scheduledAt).toISOString().slice(0, 16) : '')
    }
  }, [announcement, setValue])

  const createMutation = useMutation(
    (data) => api.post('/announcements', data),
    {
      onSuccess: () => {
        toast.success('Announcement created successfully')
        queryClient.invalidateQueries('announcements')
        navigate('/announcements')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create announcement')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/announcements/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Announcement updated successfully')
        queryClient.invalidateQueries('announcements')
        queryClient.invalidateQueries(['announcement', id])
        navigate('/announcements')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update announcement')
      }
    }
  )

  const onSubmit = (data) => {
    const payload = {
      title: data.title,
      content: data.content,
      image: data.image || undefined,
      tags: data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleContentChange = (content) => {
    setValue('content', content)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/announcements"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Announcements
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Announcement' : 'Create New Announcement'}
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
              placeholder="Enter announcement title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={watch('content')}
              onChange={handleContentChange}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              {...register('image')}
              className="input"
              placeholder="https://example.com/image.jpg"
            />
            {watch('image') && (
              <img
                src={watch('image')}
                alt="Preview"
                className="mt-2 w-full h-48 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              {...register('tags')}
              className="input"
              placeholder="tag1, tag2, tag3"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Schedule Publication (Optional)
            </label>
            <input
              type="datetime-local"
              {...register('scheduledAt')}
              className="input"
            />
            {scheduledAt && (
              <p className="mt-1 text-sm text-blue-600">
                This announcement will be published on{' '}
                {new Date(scheduledAt).toLocaleString()}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to publish immediately
            </p>
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
                ? 'Update Announcement'
                : 'Create Announcement'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/announcements')}
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

export default AnnouncementForm

