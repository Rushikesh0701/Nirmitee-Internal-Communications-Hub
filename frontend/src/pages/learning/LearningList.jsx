import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Users, Star, Clock, GraduationCap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'

const LearningList = () => {
  const { user } = useAuthStore()
  const isModerator = ['ADMIN', 'MODERATOR'].includes(user?.role?.toUpperCase())
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)

  const { data, isLoading } = useQuery(
    ['courses', page, limit],
    () => {
      const params = new URLSearchParams()
      params.append('published', 'true')
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      return api.get(`/learning?${params.toString()}`).then((res) => res.data.data)
    },
    { keepPreviousData: true }
  )

  const courses = data?.courses || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 }

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

      {isLoading && !data ? (
        <CardSkeleton count={6} />
      ) : courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/learning/${course.id}`}
                className="card transition-shadow block"
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
        !isLoading && (
          <EmptyState
            icon={GraduationCap}
            title="No courses available yet"
            message="Check back later for new learning opportunities"
          />
        )
      )}
    </div>
  )
}

export default LearningList

