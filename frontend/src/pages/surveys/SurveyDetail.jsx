import { useQuery } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, ClipboardList } from 'lucide-react'

const SurveyDetail = () => {
  const { id } = useParams()

  const { data: survey, isLoading } = useQuery(
    ['survey', id],
    () => api.get(`/surveys/${id}`).then((res) => res.data.data),
    { enabled: !!id }
  )

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!survey) {
    return <div className="text-center py-12">Survey not found</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/surveys"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Surveys
      </Link>

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
          </div>
        </div>

        {survey.hasResponded ? (
          <div className="p-6 bg-green-50 rounded-lg text-center">
            <p className="text-green-800 font-medium">
              You have already responded to this survey. Thank you!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600">
              Survey questions will be displayed here. Form implementation needed.
            </p>
            <button className="btn btn-primary">Submit Response</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SurveyDetail

