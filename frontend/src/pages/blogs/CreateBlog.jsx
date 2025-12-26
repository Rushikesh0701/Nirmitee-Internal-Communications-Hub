import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogAPI } from '../../services/blogApi';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import Editor from '../../components/blog/Editor';
import { useCreationStore } from '../../store/creationStore';

const CreateBlog = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startCreation, endCreation, isAnyCreationInProgress } = useCreationStore();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [],
    excerpt: '',
    coverImage: '',
    isPublished: false, // Default to draft/unpublished
  });
  const [tagInput, setTagInput] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState('');

  const createMutation = useMutation(
    (data) => blogAPI.create(data),
    {
      onSuccess: async (response) => {
        const blogData = response.data?.data || response.data || response;
        const blogId = blogData._id || blogData.id;
        toast.success('Blog created successfully!');
        await queryClient.invalidateQueries('blogs');
        endCreation();
        navigate(`/blogs/${blogId}`);
      },
      onError: (error) => {
        endCreation();
        const errorMessage = error.response?.data?.message || 'Failed to create blog';
        toast.error(errorMessage);
      }
    }
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContentChange = (data) => {
    setFormData({
      ...formData,
      content: data.html, // Store HTML content
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setFormData({ ...formData, coverImage: base64Image });
        setCoverImagePreview(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, coverImage: url });
    setCoverImagePreview(url);
  };

  const handleRemoveCoverImage = () => {
    setFormData({ ...formData, coverImage: '' });
    setCoverImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (createMutation.isLoading) {
      return;
    }
    
    // Prevent if any other creation is in progress
    if (isAnyCreationInProgress()) {
      toast.error('Please wait for the current creation to complete');
      return;
    }
    
    // Start creation process
    if (!startCreation('blog')) {
      toast.error('Another creation is already in progress');
      return;
    }
    
    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      endCreation();
      toast.error('Title is required');
      return;
    }
    
    if (!formData.excerpt || !formData.excerpt.trim()) {
      endCreation();
      toast.error('Excerpt is required');
      return;
    }
    
    if (!formData.content || formData.content.trim() === '' || formData.content === '<p></p>') {
      endCreation();
      toast.error('Content is required');
      return;
    }
    
    if (!formData.category || !formData.category.trim()) {
      endCreation();
      toast.error('Category is required');
      return;
    }
    
    createMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-gray-800 mb-4"
      >
        Create New Blog
      </motion.h1>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-4"
      >
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <label className="text-gray-700 font-medium whitespace-nowrap">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              id="cover-image-upload"
              className="hidden"
            />
            <label
              htmlFor="cover-image-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <span className="font-medium">Upload Image</span>
            </label>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>
            <input
              type="url"
              value={formData.coverImage}
              onChange={handleCoverImageUrlChange}
              placeholder="Enter image URL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
            />
            {coverImagePreview && (
              <div className="relative mt-3">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveCoverImage}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                  title="Remove cover image"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Upload an image or enter a URL for your blog cover image (optional)
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Excerpt <span className="text-red-500">*</span>
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="Brief description of your blog..."
            rows="3"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <Editor
            content={formData.content}
            onChange={handleContentChange}
            placeholder="Write your blog content here..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., Frontend, Backend, AI/ML, DevOps..."
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter a custom category for your blog post
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-100 text-slate-800 rounded flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 text-slate-700 border-gray-300 rounded focus:ring-slate-600"
            />
            <span className="text-gray-700">
              Publish immediately
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-1 ml-6">
            {formData.isPublished 
              ? 'This blog will be visible to everyone when created.' 
              : 'This blog will be saved as a draft and only visible to you.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={createMutation.isLoading || isAnyCreationInProgress()}
            className="px-4 sm:px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isLoading ? 'Creating...' : (
              <>
                <span className="md:hidden">Create</span>
                <span className="hidden md:inline">Create Blog</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateBlog;
