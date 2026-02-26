import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Gift, Star, Flame, Trophy, TrendingUp, Zap, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '../../components/Loading'

const ACTIVITY_ICONS = {
  BLOG_POST: '📝',
  BLOG_COMMENT: '💬',
  BLOG_LIKE: '❤️',
  DISCUSSION_CREATE: '🗣️',
  DISCUSSION_REPLY: '💭',
  POLL_VOTE: '🗳️',
  POLL_CREATE: '📊',
  COURSE_COMPLETE: '🎓',
  DAILY_LOGIN: '👋',
  STREAK_BONUS: '🔥'
}

export default function RewardsCatalog() {
  const queryClient = useQueryClient()
  const [selectedReward, setSelectedReward] = useState(null)
  const [showPointsGuide, setShowPointsGuide] = useState(false)

  const { data: catalogData, isLoading } = useQuery('rewardsCatalog', () =>
    recognitionRewardApi.getRewardsCatalog({ isActive: true })
  )
  const { data: pointsData } = useQuery('userPoints', () => recognitionRewardApi.getUserPoints())
  const { data: activityData } = useQuery('activitySummary', () =>
    recognitionRewardApi.getActivitySummary()
  )

  const redeemMutation = useMutation(recognitionRewardApi.redeemReward, {
    onSuccess: () => {
      toast.success('Reward redeemed successfully!')
      queryClient.invalidateQueries('userPoints')
      queryClient.invalidateQueries('userRedemptions')
      queryClient.invalidateQueries('activitySummary')
      setSelectedReward(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to redeem reward')
    }
  })

  const rewards = catalogData?.data?.data || []
  const userPoints = pointsData?.data?.data?.points || 0
  const activity = activityData?.data?.data || null

  const handleRedeem = (rewardId) => {
    redeemMutation.mutate(rewardId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards & Activity</h1>
          <p className="text-gray-600 mt-1">Join activities, earn points, and unlock exclusive rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl shadow-sm text-white">
            <Star className="text-white fill-current" size={24} />
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none">{userPoints}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Available Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Always Visible Points Guide */}
      <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-blue-900">Ways to Earn Points</h3>
          </div>
          <span className="text-xs font-medium text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-200">
            Points update instantly
          </span>
        </div>
        <div className="p-6">
          {activity?.pointsConfig ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {activity.pointsConfig.map((config) => (
                <div key={config.type} className="flex flex-col items-center p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-[#ff4701] transition-all group">
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {ACTIVITY_ICONS[config.type] || '⭐'}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 text-center mb-1">{config.label}</p>
                  <p className="text-xl font-black text-[#ff4701]">+{config.points}</p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {config.dailyLimit === 'Unlimited' ? 'No limit' : `${config.dailyLimit} per day`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-pulse flex gap-4 overflow-hidden">
               {[1,2,3,4,5].map(i => <div key={i} className="h-24 w-full bg-gray-100 rounded-lg" />)}
            </div>
          )}
        </div>
      </div>

      {/* Gamification Stats Row */}
      {activity && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Level Card */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={20} />
                <span className="text-sm font-medium opacity-90">Level {activity.level?.current}</span>
              </div>
              <Award size={24} className="opacity-80" />
            </div>
            <h3 className="text-xl font-bold mb-2">{activity.level?.title}</h3>
            {activity.level?.nextLevel ? (
              <>
                <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-white rounded-full h-2.5 transition-all duration-500"
                    style={{ width: `${Math.min(100, activity.level?.progress || 0)}%` }}
                  />
                </div>
                <p className="text-xs opacity-80">
                  {activity.level.nextLevel.pointsNeeded} points to {activity.level.nextLevel.title}
                </p>
              </>
            ) : (
              <p className="text-xs opacity-80">🏆 Maximum level reached!</p>
            )}
          </div>

          {/* Streak Card */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={20} />
                <span className="text-sm font-medium opacity-90">Daily Streak</span>
              </div>
              <span className="text-3xl font-bold">{activity.currentStreak || 0}</span>
            </div>
            <p className="text-lg font-bold mb-1">
              {activity.currentStreak >= activity.streakThreshold
                ? '🎉 Streak Bonus Active!'
                : `${activity.streakThreshold - (activity.currentStreak || 0)} days to bonus`}
            </p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: activity.streakThreshold }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < (activity.currentStreak || 0) ? 'bg-white' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs opacity-80 mt-2">
              Login daily to maintain your streak • +{activity.pointsConfig?.find(c => c.type === 'STREAK_BONUS')?.points || 10} bonus after {activity.streakThreshold} days
            </p>
          </div>

          {/* Weekly Points Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} />
                <span className="text-sm font-medium opacity-90">This Week</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">+{activity.weeklyPoints || 0}</h3>
            <p className="text-sm opacity-90">Points earned this week</p>
            <p className="text-xs opacity-80 mt-2">Total: {activity.totalPoints || 0} points all time</p>
          </div>
        </div>
      )}

      {/* Activity Breakdown */}
      {activity?.activityBreakdown?.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-gray-600" size={20} />
            Your Activity Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {activity.activityBreakdown.map((item) => (
              <div key={item.type} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{ACTIVITY_ICONS[item.type] || '⭐'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.count}× • {item.totalPoints} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Catalog */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="text-gray-600" size={22} />
          Rewards Catalog
        </h2>

        {isLoading ? (
          <Loading />
        ) : rewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <div key={reward.id || reward._id} className="bg-white rounded-lg p-6 border border-gray-100 hover:shadow-md transition-shadow">
                {reward.image && (
                  <img src={reward.image} alt={reward.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-lg mb-4 mx-auto">
                  <Gift className="text-slate-700" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{reward.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star size={16} />
                    <span className="font-medium">{reward.points} points</span>
                  </div>
                  <button
                    onClick={() => setSelectedReward(reward)}
                    disabled={userPoints < reward.points}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      userPoints >= reward.points
                        ? 'bg-[#ff4701] text-white hover:bg-[#ff5500]'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gift className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600 text-lg">No rewards available at the moment</p>
            <p className="text-gray-400 text-sm mt-1">Keep earning points — rewards are coming soon!</p>
          </div>
        )}
      </div>

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Redemption</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to redeem <strong>{selectedReward.title}</strong> for{' '}
              <strong>{selectedReward.points} points</strong>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleRedeem(selectedReward.id || selectedReward._id)}
                disabled={redeemMutation.isLoading}
                className="flex-1 px-4 py-2 bg-[#ff4701] text-white rounded-lg hover:bg-[#ff5500] disabled:opacity-50"
              >
                {redeemMutation.isLoading ? 'Redeeming...' : 'Confirm'}
              </button>
              <button
                onClick={() => setSelectedReward(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
