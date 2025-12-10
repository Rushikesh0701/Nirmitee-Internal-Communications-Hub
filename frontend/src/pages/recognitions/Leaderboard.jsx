import { useQuery } from 'react-query'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Trophy, Medal, Award, Star } from 'lucide-react'
import Loading from '../../components/Loading'

export default function Leaderboard() {
  const { data, isLoading } = useQuery('leaderboard', () =>
    recognitionRewardApi.getLeaderboard({ limit: 50 })
  )

  const leaderboard = data?.data?.data || []

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />
    if (rank === 2) return <Medal className="text-gray-400" size={24} />
    if (rank === 3) return <Award className="text-orange-500" size={24} />
    return <span className="text-gray-500 font-semibold">#{rank}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600 mt-1">Top performers by recognition points</p>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`p-6 flex items-center gap-4 ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                }`}
              >
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-1 flex items-center gap-4">
                  {entry.user?.avatar ? (
                    <img
                      src={entry.user.avatar}
                      alt={entry.user.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {entry.user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{entry.user?.name}</h3>
                    <p className="text-sm text-gray-500">{entry.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-500" size={20} />
                    <span className="text-xl font-bold text-gray-900">{entry.points}</span>
                    <span className="text-sm text-gray-500">points</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && leaderboard.length === 0 && (
        <div className="text-center py-12 text-gray-500">No leaderboard data yet</div>
      )}
    </div>
  )
}

