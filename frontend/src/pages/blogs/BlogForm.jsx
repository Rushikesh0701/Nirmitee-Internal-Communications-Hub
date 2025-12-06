import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'

// Simple rich text editor component
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
    const textarea = document.getElementById('blog-content-editor')
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
        id="blog-content-editor"
        value={content}
        onChange={handleChange}
        rows={15}
        className="input font-mono text-sm"
        placeholder="Write your blog content. Use HTML tags for formatting."
      />
      <p className="text-xs text-gray-500">
        Tip: You can use HTML tags like &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;a&gt; for formatting
      </p>
    </div>
  )
}

const BlogForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      coverImage: '',
      tags: '',
      isPublished: false
    },
    mode: 'onChange' // Validate on change for better UX
  })

  // Load existing blog if editing
  const { data: blog, isLoading } = useQuery(
    ['blog', id],
    () => api.get(`/blogs/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (blog) {
      setValue('title', blog.title)
      setValue('content', blog.content)
      setValue('excerpt', blog.excerpt || '')
      setValue('coverImage', blog.coverImage || '')
      setValue('tags', blog.tags?.join(', ') || '')
      setValue('isPublished', blog.isPublished || false)
    }
  }, [blog, setValue])

  const createMutation = useMutation(
    (data) => api.post('/blogs', data),
    {
      onSuccess: () => {
        toast.success('Blog created successfully')
        queryClient.invalidateQueries('blogs')
        navigate('/blogs')
      },
      onError: (error) => {
        // Prevent any default behavior
        console.error('Blog creation error:', error)
        
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Failed to create blog'
        
        // Handle authentication errors specifically
        if (error.response?.status === 401 || 
            errorMessage.includes('dummy user IDs are not allowed') || 
            errorMessage.includes('Invalid user ID') ||
            errorMessage.includes('authentication') ||
            errorMessage.includes('login')) {
          toast.error('Please login to create a blog')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        } else if (error.response?.status === 400) {
          // Validation errors - show the message
          toast.error(errorMessage)
        } else {
          toast.error(errorMessage)
        }
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/blogs/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Blog updated successfully')
        queryClient.invalidateQueries('blogs')
        queryClient.invalidateQueries(['blog', id])
        navigate('/blogs')
      },
      onError: (error) => {
        console.error('Blog update error:', error)
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Failed to update blog'
        
        if (error.response?.status === 400) {
          toast.error(errorMessage)
        } else if (error.response?.status === 403) {
          toast.error('You are not authorized to update this blog')
        } else if (error.response?.status === 404) {
          toast.error('Blog not found')
        } else {
          toast.error(errorMessage)
        }
      }
    }
  )

  const onSubmit = (data, e) => {
    // Prevent default form submission and page refresh
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Validate required fields before submitting
    if (!data.title || !data.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!data.content || !data.content.trim()) {
      toast.error('Content is required')
      return
    }

    const payload = {
      title: data.title.trim(),
      content: data.content.trim(),
      excerpt: data.excerpt?.trim() || undefined,
      coverImage: data.coverImage?.trim() || undefined,
      tags: data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [],
      isPublished: data.isPublished || false
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
        to="/blogs"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Blogs
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Blog' : 'Write New Blog'}
        </h1>

        <form 
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit(onSubmit)(e)
          }} 
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input"
              placeholder="Enter blog title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excerpt
            </label>
            <textarea
              {...register('excerpt')}
              rows={3}
              className="input"
              placeholder="Brief summary of your blog"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={watch('content')}
              onChange={handleContentChange}
            />
            <input
              type="hidden"
              {...register('content', { 
                required: 'Content is required',
                validate: (value) => {
                  if (!value || !value.trim()) {
                    return 'Content cannot be empty'
                  }
                  return true
                }
              })}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              {...register('coverImage')}
              className="input"
              placeholder="https://example.com/image.jpg"
            />
            {watch('coverImage') && (
              <img
                src={watch('coverImage')}
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
                ? 'Update Blog'
                : 'Publish Blog'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/blogs')}
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

export default BlogForm

