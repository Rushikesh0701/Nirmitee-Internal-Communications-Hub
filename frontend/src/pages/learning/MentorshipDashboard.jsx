import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { learningApi } from '../../services/learningApi';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle,
  Clock,
  MessageSquare,
  Search
} from 'lucide-react';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const MentorshipDashboard = () => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('my-mentorships'); // my-mentorships, find-mentor, requests
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's mentorships
  const { data: mentorships, isLoading: isLoadingMentorships } = useQuery(
    'my-mentorships',
    () => learningApi.getUserMentorships().then(res => res.data?.data || res.data || [])
  );

  // Fetch available mentors (if user wants to find a mentor)
  const { data: mentors, isLoading: isLoadingMentors } = useQuery(
    'available-mentors',
    async () => {
      // This would typically be a separate endpoint
      // For now, we'll use a placeholder
      try {
        const response = await api.get('/users', { params: { role: 'mentor' } });
        return response.data?.data || response.data || [];
      } catch (error) {
        return [];
      }
    },
    { enabled: activeTab === 'find-mentor' }
  );

  // Filter mentorships by status
  const pendingMentorships = mentorships?.filter(m => m.status === 'pending') || [];
  const activeMentorships = mentorships?.filter(m => m.status === 'accepted') || [];
  const completedMentorships = mentorships?.filter(m => m.status === 'completed') || [];

  // Update mentorship status mutation
  const updateMentorshipMutation = useMutation(
    ({ id, status }) => learningApi.updateMentorshipStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-mentorships');
        toast.success('Mentorship status updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update mentorship');
      }
    }
  );

  // Create mentorship request mutation
  const createMentorshipMutation = useMutation(
    (mentorId) => learningApi.createMentorship(mentorId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-mentorships');
        toast.success('Mentorship request sent');
        setActiveTab('my-mentorships');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send mentorship request');
      }
    }
  );

  const handleUpdateStatus = (id, status) => {
    updateMentorshipMutation.mutate({ id, status });
  };

  const handleRequestMentorship = (mentorId) => {
    createMentorshipMutation.mutate(mentorId);
  };

  const filteredMentors = mentors?.filter(mentor => {
    if (!searchTerm) return true;
    const name = `${mentor.firstName || ''} ${mentor.lastName || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  }) || [];

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-500', text: 'Pending' },
      accepted: { icon: CheckCircle, color: 'bg-green-500', text: 'Active' },
      rejected: { icon: XCircle, color: 'bg-red-500', text: 'Rejected' },
      completed: { icon: CheckCircle, color: 'bg-blue-500', text: 'Completed' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${badge.color}`}>
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Mentorship Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your mentorship relationships
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('my-mentorships')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'my-mentorships'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          My Mentorships
        </button>
        <button
          onClick={() => setActiveTab('find-mentor')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'find-mentor'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Find a Mentor
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-mentorships' && (
        <>
          {isLoadingMentorships ? (
            <DetailSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {mentorships?.length || 0}
                      </p>
                    </div>
                    <Users size={24} className="text-blue-500" />
                  </div>
                </div>
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {activeMentorships.length}
                      </p>
                    </div>
                    <CheckCircle size={24} className="text-green-500" />
                  </div>
                </div>
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {pendingMentorships.length}
                      </p>
                    </div>
                    <Clock size={24} className="text-yellow-500" />
                  </div>
                </div>
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {completedMentorships.length}
                      </p>
                    </div>
                    <CheckCircle size={24} className="text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Active Mentorships */}
              {activeMentorships.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Active Mentorships
                  </h2>
                  <div className="space-y-3">
                    {activeMentorships.map((mentorship) => {
                      const mentor = mentorship.mentor || mentorship.mentorId;
                      const mentee = mentorship.mentee || mentorship.menteeId;
                      const isMentor = mentor?._id === user?._id || mentor === user?._id;
                      const otherPerson = isMentor ? mentee : mentor;
                      
                      return (
                        <div key={mentorship._id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500 rounded-full text-white">
                                <Users size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                  {isMentor ? 'Mentee' : 'Mentor'}: {otherPerson?.firstName || 'Unknown'} {otherPerson?.lastName || ''}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Started: {new Date(mentorship.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(mentorship.status)}
                              {mentorship.status === 'accepted' && (
                                <button
                                  onClick={() => handleUpdateStatus(mentorship._id, 'completed')}
                                  className="btn-secondary text-sm"
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending Requests */}
              {pendingMentorships.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Pending Requests
                  </h2>
                  <div className="space-y-3">
                    {pendingMentorships.map((mentorship) => {
                      const mentor = mentorship.mentor || mentorship.mentorId;
                      const mentee = mentorship.mentee || mentorship.menteeId;
                      const isMentor = mentor?._id === user?._id || mentor === user?._id;
                      const otherPerson = isMentor ? mentee : mentor;
                      const canApprove = isMentor; // Only mentors can approve
                      
                      return (
                        <div key={mentorship._id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-500 rounded-full text-white">
                                <Clock size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                  {isMentor ? 'Mentee' : 'Mentor'}: {otherPerson?.firstName || 'Unknown'} {otherPerson?.lastName || ''}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Requested: {new Date(mentorship.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(mentorship.status)}
                              {canApprove && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(mentorship._id, 'accepted')}
                                    className="btn-primary text-sm"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(mentorship._id, 'rejected')}
                                    className="btn-secondary text-sm"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {mentorships?.length === 0 && (
                <EmptyState
                  icon={Users}
                  title="No mentorships yet"
                  message="Start a mentorship relationship to see it here"
                  action={
                    <button
                      onClick={() => setActiveTab('find-mentor')}
                      className="btn-primary"
                    >
                      Find a Mentor
                    </button>
                  }
                />
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'find-mentor' && (
        <>
          {/* Search */}
          <div className="card">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search for mentors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Mentors List */}
          {isLoadingMentors ? (
            <DetailSkeleton />
          ) : filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map((mentor) => (
                <div key={mentor._id || mentor.id} className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500 rounded-full text-white">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {mentor.firstName} {mentor.lastName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {mentor.department || 'Mentor'}
                      </p>
                    </div>
                  </div>
                  {mentor.bio && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {mentor.bio}
                    </p>
                  )}
                  <button
                    onClick={() => handleRequestMentorship(mentor._id || mentor.id)}
                    className="btn-primary w-full"
                    disabled={createMentorshipMutation.isLoading}
                  >
                    {createMentorshipMutation.isLoading ? 'Sending...' : 'Request Mentorship'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No mentors found"
              message="Try adjusting your search terms"
              compact
            />
          )}
        </>
      )}
    </motion.div>
  );
};

export default MentorshipDashboard;

