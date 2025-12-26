import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { isAdminOrModerator } from '../../utils/userHelpers'
import api from '../../services/api'
import { ArrowLeft, ClipboardList, Send, BarChart3 } from 'lucide-react'
import Loading from '../../components/Loading'

const SurveyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [responses, setResponses] = useState({})

  const { data: survey, isLoading } = useQuery(
    ['survey', id],
    () => api.get(`/surveys/${id}`).then((res) => res.data.data),
    { enabled: !!id }
  )

  const submitMutation = useMutation(
    (data) => api.post(`/surveys/${id}/submit`, data),
    {
      onSuccess: () => {
        toast.success('Survey response submitted successfully!')
        queryClient.invalidateQueries(['survey', id])
        queryClient.invalidateQueries('surveys')
        navigate('/surveys')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit survey')
      }
    }
  )

  const handleResponseChange = (questionId, value) => {
    setResponses({ ...responses, [questionId]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!survey || !survey.questions) {
      return
    }

    // Validate all required questions are answered
    const requiredQuestions = survey.questions.filter(q => q.required)
    const missingRequired = requiredQuestions.some(q => !responses[q._id])
    
    if (missingRequired) {
      toast.error('Please answer all required questions')
      return
    }

    // Format responses for API
    const formattedResponses = survey.questions.map((question) => {
      const questionId = question._id || question.id
      const answer = responses[questionId] || ''
      
      return {
        questionId: questionId,
        questionText: question.questionText,
        questionType: question.type,
        answer: question.type === 'MCQ' ? answer : answer.toString(),
        selectedOption: question.type === 'MCQ' ? answer : null
      }
    })

    submitMutation.mutate({ responses: formattedResponses })
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (!survey) {
    return <div className="text-center py-12">Survey not found</div>
  }

  const isActive = survey.status === 'ACTIVE'
  const hasResponded = survey.hasResponded
  const canViewAnalytics = isAdminOrModerator(user)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/surveys"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft size={18} />
          Back to Surveys
        </Link>
        {canViewAnalytics && (
          <Link
            to={`/surveys/${id}/analytics`}
            className="btn btn-secondary flex items-center gap-2"
          >
            <BarChart3 size={18} />
            View Analytics
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-pink-100 rounded-lg">
            <ClipboardList className="text-pink-600" size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-gray-600">{survey.description}</p>
            )}
            {!isActive && (
              <p className="mt-2 text-sm text-red-600 font-medium">
                This survey is {survey.status.toLowerCase()}
              </p>
            )}
          </div>
        </div>

        {hasResponded ? (
          <div className="p-6 bg-green-50 rounded-lg text-center">
            <p className="text-green-800 font-medium">
              You have already responded to this survey. Thank you!
            </p>
          </div>
        ) : !isActive ? (
          <div className="p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">
              This survey is not currently accepting responses.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {survey.questions && survey.questions.length > 0 ? (
              survey.questions.map((question, index) => {
                const questionId = question._id || question.id
                const currentResponse = responses[questionId] || ''

                return (
                  <div key={questionId} className="border-b pb-6 last:border-b-0">
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      {index + 1}. {question.questionText}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>

                    {question.type === 'TEXT' && (
                      <textarea
                        value={currentResponse}
                        onChange={(e) => handleResponseChange(questionId, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={4}
                        placeholder="Enter your answer..."
                        required={question.required}
                      />
                    )}

                    {question.type === 'MCQ' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label
                            key={optIndex}
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={questionId}
                              value={option}
                              checked={currentResponse === option}
                              onChange={(e) => handleResponseChange(questionId, e.target.value)}
                              className="text-primary-600 focus:ring-primary-500"
                              required={question.required}
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'RATING' && (
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label
                            key={rating}
                            className="flex items-center justify-center w-12 h-12 border-2 border-gray-300 rounded-lg hover:bg-primary-50 hover:border-primary-500 cursor-pointer transition-colors"
                          >
                            <input
                              type="radio"
                              name={questionId}
                              value={rating}
                              checked={currentResponse === rating.toString()}
                              onChange={(e) => handleResponseChange(questionId, e.target.value)}
                              className="sr-only"
                              required={question.required}
                            />
                            <span className={`text-lg font-semibold ${
                              currentResponse === rating.toString()
                                ? 'text-primary-600'
                                : 'text-gray-400'
                            }`}>
                              {rating}
                            </span>
                          </label>
                        ))}
                        <span className="ml-4 text-sm text-gray-500">
                          {currentResponse ? `${currentResponse}/5` : 'Select rating'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 text-center py-8">
                No questions available for this survey.
              </p>
            )}

            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/surveys')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitMutation.isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Send size={18} />
                {submitMutation.isLoading ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default SurveyDetail

