import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Plus, Award, Trophy, Star } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'

export default function RecognitionsFeed() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const { data, isLoading } = useQuery(
    ['recognitionFeed', page, limit],
    () => recognitionRewardApi.getRecognitionFeed({ page, limit }),
    { keepPreviousData: true, refetchOnMount: 'always' }
  )

  const recognitions = data?.data?.recognitions || []
  const pagination = data?.data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Recognition Feed</h1>
          <p className="text-gray-600 mt-1">Celebrate your colleagues&apos; achievements</p>
        </div>
        <Link
          to="/recognitions/new"
          className="btn-add"
        >
          <Plus size={16} />
          Give Recognition
        </Link>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          {recognitions.length > 0 ? (
            <>
              <div className="space-y-4">
                {recognitions.map((recognition) => (
                  <div key={recognition.id} className="bg-white rounded-lg p-6">
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
              </div>
              {pagination.pages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={pagination.pages}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                  showLimitSelector={true}
                />
              )}
            </>
          ) : (
            <EmptyState
              icon={Award}
              title="No recognitions yet"
              message="Be the first to recognize a colleague!"
            />
          )}
        </>
      )}
    </div>
  )
}

