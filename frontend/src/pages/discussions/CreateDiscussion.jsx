import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import { discussionAPI } from '../../services/discussionApi';
import toast from 'react-hot-toast';
import { useCreationStore } from '../../store/creationStore';

const CreateDiscussion = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startCreation, endCreation, isAnyCreationInProgress } = useCreationStore();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

  const createMutation = useMutation(
    (data) => discussionAPI.create(data),
    {
      onSuccess: async (response) => {
        const discussionData = response.data?.data || response.data || response;
        const discussionId = discussionData._id || discussionData.id;
        toast.success('Discussion created successfully!');
        await queryClient.invalidateQueries('discussions');
        endCreation();
        navigate(`/discussions/${discussionId}`);
      },
      onError: (error) => {
        endCreation();
        toast.error(error.response?.data?.message || 'Failed to create discussion');
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    if (!startCreation('discussion')) {
      toast.error('Another creation is already in progress');
      return;
    }
    
    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      endCreation();
      toast.error('Title is required');
      return;
    }
    
    if (!formData.content || !formData.content.trim()) {
      endCreation();
      toast.error('Content is required');
      return;
    }
    
    createMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-800 mb-8"
      >
        Start New Discussion
      </motion.h1>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="What's your question?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">
            Content
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows="8"
            placeholder="Describe your question in detail..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
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
              placeholder="Add a tag (e.g., React, Node.js)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded flex items-center gap-2"
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

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={createMutation.isLoading || isAnyCreationInProgress()}
            className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isLoading ? 'Posting...' : (
              <>
                <span className="md:hidden">Post</span>
                <span className="hidden md:inline">Post Discussion</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/discussions')}
            className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateDiscussion;

