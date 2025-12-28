import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Gift, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Loading from '../../components/Loading'

export default function RewardsCatalog() {
  const queryClient = useQueryClient()
  const [selectedReward, setSelectedReward] = useState(null)

  const { data: catalogData, isLoading } = useQuery('rewardsCatalog', () =>
    recognitionRewardApi.getRewardsCatalog({ isActive: true })
  )
  const { data: pointsData } = useQuery('userPoints', () => recognitionRewardApi.getUserPoints())

  const redeemMutation = useMutation(recognitionRewardApi.redeemReward, {
    onSuccess: () => {
      toast.success('Reward redeemed successfully!')
      queryClient.invalidateQueries('userPoints')
      queryClient.invalidateQueries('userRedemptions')
      setSelectedReward(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to redeem reward')
    }
  })

  const rewards = catalogData?.data?.data || []
  const userPoints = pointsData?.data?.data?.points || 0

  const handleRedeem = (rewardId) => {
    redeemMutation.mutate(rewardId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards Catalog</h1>
          <p className="text-gray-600 mt-1">Redeem your points for rewards</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-lg">
          <Star className="text-yellow-600" size={20} />
          <span className="font-semibold text-yellow-800">{userPoints} Points</span>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-white rounded-lg p-6">
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
        </div>
      )}

      {selectedReward && (
        <div className="fixed inset-0 bg-[#ff4701] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Redemption</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to redeem <strong>{selectedReward.title}</strong> for{' '}
              <strong>{selectedReward.points} points</strong>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleRedeem(selectedReward.id)}
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

