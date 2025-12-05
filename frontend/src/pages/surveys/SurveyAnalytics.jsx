import { useQuery } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { isAdminOrModerator } from '../../utils/userHelpers'
import api from '../../services/api'
import { ArrowLeft, ClipboardList, BarChart3, Users, TrendingUp } from 'lucide-react'
import { Navigate } from 'react-router-dom'

const SurveyAnalytics = () => {
  const { id } = useParams()
  const { user } = useAuthStore()

  const { data: analytics, isLoading } = useQuery(
    ['surveyAnalytics', id],
    () => api.get(`/surveys/${id}/analytics`).then((res) => res.data.data),
    { enabled: !!id }
  )

  // Check if user can view analytics
  if (!isAdminOrModerator(user)) {
    return <Navigate to="/surveys" replace />
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  if (!analytics) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to={`/surveys/${id}`}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft size={18} />
          Back to Survey
        </Link>
        <div className="card p-6 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to={`/surveys/${id}`}
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Survey
      </Link>

      <div className="card">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-pink-100 rounded-lg">
            <BarChart3 className="text-pink-600" size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Survey Analytics: {analytics.title}
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={18} />
                <span className="font-semibold">{analytics.totalResponses} Total Responses</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {analytics.questions && analytics.questions.length > 0 ? (
            analytics.questions.map((question, index) => (
              <div key={question.questionId} className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Question {index + 1}: {question.questionText}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={16} />
                      {question.responseCount} responses
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {question.type}
                    </span>
                  </div>
                </div>

                {/* Rating Question Analytics */}
                {question.type === 'RATING' && question.averageRating && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {question.averageRating} / 5
                        </p>
                      </div>
                      {question.ratingDistribution && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Range</p>
                          <p className="text-lg font-semibold">
                            {question.ratingDistribution.min} - {question.ratingDistribution.max}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MCQ Question Analytics */}
                {question.type === 'MCQ' && question.optionDistribution && (
                  <div className="space-y-3">
                    {question.options && question.options.length > 0 ? (
                      question.options.map((option) => {
                        const count = question.optionDistribution[option] || 0
                        const percentage =
                          question.responseCount > 0
                            ? ((count / question.responseCount) * 100).toFixed(1)
                            : 0

                        return (
                          <div key={option} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{option}</span>
                              <span className="font-semibold text-gray-900">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">No options available</p>
                    )}
                  </div>
                )}

                {/* Text Question Analytics */}
                {question.type === 'TEXT' && (
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        {question.textResponseCount} text responses received
                      </p>
                      {question.sampleResponses && question.sampleResponses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-700 uppercase">
                            Sample Responses:
                          </p>
                          {question.sampleResponses.map((response, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white rounded border border-gray-200 text-sm text-gray-700"
                            >
                              "{response}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No questions in this survey
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SurveyAnalytics



