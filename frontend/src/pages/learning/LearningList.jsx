import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Users, Star, Clock } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Loading from '../../components/Loading'

const LearningList = () => {
  const { user } = useAuthStore()
  const isModerator = ['ADMIN', 'MODERATOR'].includes(user?.role?.toUpperCase())

  const { data, isLoading } = useQuery('courses', () =>
    api.get('/learning?published=true').then((res) => res.data.data),
    { refetchOnMount: 'always' }
  )

  if (isLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Learning & Development</h1>
          <p className="text-gray-600 text-sm mt-0.5">Expand your skills</p>
        </div>
        {isModerator && (
          <Link to="/learning/new" className="btn btn-primary flex items-center gap-2">
            Create Course
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.courses?.map((course) => (
          <Link
            key={course.id}
            to={`/learning/${course.id}`}
            className="card hover:shadow-lg transition-shadow block"
          >
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-24 object-cover rounded-lg mb-2"
              />
            )}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                {course.title}
              </h3>
              {course.description && (
                <p className="text-gray-600 line-clamp-2 text-xs">
                  {course.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{course.enrollmentCount} enrolled</span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{course.duration} min</span>
                  </div>
                )}
                {course.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span>{course.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!data?.courses?.length && (
        <div className="text-center py-12 text-gray-500">
          No courses available yet
        </div>
      )}
    </div>
  )
}

export default LearningList

