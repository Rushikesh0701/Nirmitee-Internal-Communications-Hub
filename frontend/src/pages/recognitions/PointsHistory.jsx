import { useQuery } from 'react-query'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Star, Gift, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'

export default function PointsHistory() {
  const { data: pointsData } = useQuery('userPoints', () => recognitionRewardApi.getUserPoints())
  const { data: redemptionsData, isLoading } = useQuery('userRedemptions', () =>
    recognitionRewardApi.getUserRedemptions()
  )

  const userPoints = pointsData?.data?.data?.points || 0
  const redemptions = redemptionsData?.data?.data || []

  return (
    <div className="space-y-3">
      <div className="bg-blue-600 rounded-lg p-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-100 text-sm mb-2">Total Points</p>
            <div className="flex items-center gap-2">
              <Star size={32} />
              <span className="text-2xl font-bold">{userPoints}</span>
            </div>
          </div>
          <TrendingUp size={48} className="opacity-50" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Redemption History</h2>
        {isLoading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Gift className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{redemption.reward?.title}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(redemption.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-600 mb-1">
                      <Star size={16} />
                      <span className="font-medium">-{redemption.reward?.points}</span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        redemption.status === 'APPROVED'
                          ? 'text-green-600'
                          : redemption.status === 'REJECTED'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {redemption.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && redemptions.length === 0 && (
          <div className="text-center py-12 text-gray-500">No redemption history</div>
        )}
      </div>
    </div>
  )
}

