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
    <div className="w-full space-y-3">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-slate-800 mb-3"
      >
        Start New Discussion
      </motion.h1>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
        className="card p-4 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="What's your question?"
            className="input text-sm py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows="8"
            placeholder="Describe your question in detail..."
            className="input text-sm py-2 resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1.5">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag (e.g., React, Node.js)"
              className="input flex-1 text-sm py-2"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn-add"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg flex items-center gap-2 text-sm"
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

        <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-[#0a3a3c]">
          <button
            type="submit"
            disabled={createMutation.isLoading || isAnyCreationInProgress()}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isLoading ? 'Posting...' : 'Post Discussion'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/discussions')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateDiscussion;

