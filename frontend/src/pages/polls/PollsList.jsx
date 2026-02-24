import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { isAdminOrModerator } from '../../utils/userHelpers'
import { pollApi } from '../../services/pollApi'
import { BarChart3, Plus, Clock, Users, CheckCircle2, XCircle, Timer } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'

const PollCard = ({ poll, onVote }) => {
  const [voting, setVoting] = useState(false)
  const hasVoted = poll.hasVoted
  const isExpired = poll.status === 'CLOSED'
  const totalVotes = poll.totalVotes || 0

  const handleVote = async (optionIndex) => {
    if (hasVoted || isExpired || voting) return
    setVoting(true)
    try {
      await onVote(poll._id, optionIndex)
    } finally {
      setVoting(false)
    }
  }

  const getTimeLeft = () => {
    if (!poll.expiresAt) return null
    const expiry = new Date(poll.expiresAt)
    if (expiry <= new Date()) return 'Expired'
    return formatDistanceToNow(expiry, { addSuffix: true })
  }

  const timeLeft = getTimeLeft()

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-h2 text-gray-900 mb-1">{poll.question}</h3>
          <div className="flex items-center gap-3 text-caption text-gray-500">
            {poll.isAnonymous ? (
              <span className="text-gray-400">🕵️ Anonymous</span>
            ) : poll.createdBy ? (
              <span>
                by {poll.createdBy.firstName} {poll.createdBy.lastName}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Users size={14} />
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </span>
            {timeLeft && (
              <span className="flex items-center gap-1">
                <Timer size={14} />
                {timeLeft}
              </span>
            )}
          </div>
        </div>
        {isExpired ? (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
            <XCircle size={12} /> Closed
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} /> Active
          </span>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0
          const isUserVote = hasVoted && poll.userVote === index

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={hasVoted || isExpired || voting}
              className={`w-full text-left relative overflow-hidden rounded-lg border transition-all duration-300 ${
                isUserVote
                  ? 'border-indigo-500 bg-indigo-50'
                  : hasVoted || isExpired
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'
              }`}
            >
              {/* Progress bar background */}
              {(hasVoted || isExpired) && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isUserVote ? 'bg-indigo-200/60' : 'bg-gray-200/60'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  {!hasVoted && !isExpired ? (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  ) : isUserVote ? (
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${isUserVote ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {option.text}
                  </span>
                </div>
                {(hasVoted || isExpired) && (
                  <span className={`text-sm font-semibold ${isUserVote ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!hasVoted && !isExpired && (
        <p className="text-xs text-gray-400 mt-3 text-center">Click an option to vote</p>
      )}
    </div>
  )
}

const PollsList = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)

  const { data, isLoading } = useQuery(
    ['polls', page, limit],
    () => pollApi.getPolls({ page, limit }).then(res => res.data.data),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false
    }
  )

  const voteMutation = useMutation(
    ({ pollId, optionIndex }) => pollApi.votePoll(pollId, optionIndex),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['polls'])
      }
    }
  )

  const handleVote = async (pollId, optionIndex) => {
    await voteMutation.mutateAsync({ pollId, optionIndex })
  }

  const polls = data?.polls || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-gray-900">Quick Polls</h1>
          <p className="text-gray-600 mt-1">Vote on quick decisions</p>
        </div>
        <Link to="/polls/create" className="btn-add">
          <Plus size={16} />
          Create Poll
        </Link>
      </div>

      {isLoading && !data ? (
        <CardSkeleton count={6} />
      ) : polls.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.map((poll) => (
              <PollCard key={poll._id} poll={poll} onVote={handleVote} />
            ))}
          </div>
          {pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => {
                setLimit(newLimit)
                setPage(1)
              }}
              showLimitSelector={true}
            />
          )}
        </>
      ) : (
        !isLoading && (
          <EmptyState
            icon={BarChart3}
            title="No polls yet"
            message="Create the first poll and get everyone's opinion!"
          />
        )
      )}
    </div>
  )
}

export default PollsList
