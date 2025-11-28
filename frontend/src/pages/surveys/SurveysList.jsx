import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { ClipboardList, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'

const SurveysList = () => {
  const { data, isLoading } = useQuery('surveys', () =>
    api.get('/surveys?active=true').then((res) => res.data.data)
  )

  if (isLoading) {
    return <div className="text-center py-12">Loading surveys...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
        <p className="text-gray-600 mt-1">Share your feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.surveys?.map((survey) => (
          <Link
            key={survey.id}
            to={`/surveys/${survey.id}`}
            className="card hover:shadow-lg transition-shadow block"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <ClipboardList className="text-pink-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {survey.title}
                </h3>
                {survey.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {survey.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{survey.responseCount} responses</span>
                  </div>
                  {survey.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>
                        Ends {format(new Date(survey.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!data?.surveys?.length && (
        <div className="text-center py-12 text-gray-500">
          No active surveys
        </div>
      )}
    </div>
  )
}

export default SurveysList

