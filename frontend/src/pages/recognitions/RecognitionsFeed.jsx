import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Plus, Award, Trophy, Star } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'

export default function RecognitionsFeed() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery(
    ['recognitionFeed', page],
    () => recognitionRewardApi.getRecognitionFeed({ page, limit: 10 }),
    { refetchOnMount: 'always' }
  )

  const recognitions = data?.data?.recognitions || []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recognition Feed</h1>
          <p className="text-gray-600 mt-1">Celebrate your colleagues&apos; achievements</p>
        </div>
        <Link
          to="/recognitions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Give Recognition
        </Link>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {recognitions.map((recognition) => (
            <div key={recognition.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="text-yellow-600" size={24} />
                </div>
                <div className="flex-1">
                  {recognition.badge && (
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="text-yellow-500" size={16} />
                      <span className="text-sm font-medium text-yellow-700">{recognition.badge}</span>
                    </div>
                  )}
                  <p className="text-gray-700 mb-3">{recognition.message}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>
                        From: <strong>{recognition.sender?.name}</strong>
                      </span>
                      <span>
                        To: <strong>{recognition.receiver?.name}</strong>
                      </span>
                      {recognition.points > 0 && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star size={14} />
                          {recognition.points} points
                        </span>
                      )}
                    </div>
                    <span>{format(new Date(recognition.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pagination && pagination.pages > page && (
            <button
              onClick={() => setPage(page + 1)}
              className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {!isLoading && recognitions.length === 0 && (
        <div className="text-center py-12 text-gray-500">No recognitions yet</div>
      )}
    </div>
  )
}

