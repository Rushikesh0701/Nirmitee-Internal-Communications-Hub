import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import MentionInput from './MentionInput'
import { Image as ImageIcon, X, Send } from 'lucide-react'

const PostComposer = ({ groupId, onSuccess }) => {
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const queryClient = useQueryClient()

  const createPostMutation = useMutation(
    (postData) => api.post(`/groups/${groupId}/posts`, postData),
    {
      onSuccess: () => {
        toast.success('Post created successfully')
        setContent('')
        setImages([])
        setImagePreviews([])
        queryClient.invalidateQueries(['groupPosts', groupId])
        queryClient.invalidateQueries(['group', groupId])
        if (onSuccess) onSuccess()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create post')
      }
    }
  )

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const newImages = [...images, ...files]
    setImages(newImages)

    const newPreviews = []
    newImages.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result)
        if (newPreviews.length === newImages.length) {
          setImagePreviews(newPreviews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!content.trim() && images.length === 0) {
      toast.error('Please add some content or images')
      return
    }

    createPostMutation.mutate({
      content,
      images: imagePreviews
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <MentionInput
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Type @ to mention someone..."
          className="resize-none"
        />
      </div>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="cursor-pointer inline-flex items-center gap-2 text-purple-300/70 hover:text-purple-200 transition-colors">
          <ImageIcon size={20} />
          <span>Add Images</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={createPostMutation.isLoading || (!content.trim() && images.length === 0)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Send size={18} />
          {createPostMutation.isLoading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}

export default PostComposer
