import { useQuery } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, GraduationCap, Users, Star, Clock } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const CourseDetail = () => {
  const { id } = useParams()
  const { user } = useAuthStore()

  const { data: course, isLoading } = useQuery(
    ['course', id],
    () => api.get(`/learning/${id}`).then((res) => res.data.data),
    { enabled: !!id }
  )

  const handleEnroll = async () => {
    try {
      await api.post(`/learning/${id}/enroll`)
      toast.success('Successfully enrolled!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enrollment failed')
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/learning"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Courses
      </Link>

      <div className="card">
        {course.thumbnail && (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{course.enrollmentCount} enrolled</span>
            </div>
            {course.duration && (
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{course.duration} minutes</span>
              </div>
            )}
            {course.rating > 0 && (
              <div className="flex items-center gap-2">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span>{course.rating.toFixed(1)} rating</span>
              </div>
            )}
            <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
              {course.level}
            </span>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {course.description}
            </p>
          </div>

          {course.enrollment ? (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                You are enrolled in this course
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${course.enrollment.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Progress: {course.enrollment.progress}%
                </p>
              </div>
            </div>
          ) : (
            <button onClick={handleEnroll} className="btn btn-primary">
              <GraduationCap size={18} className="mr-2" />
              Enroll in Course
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseDetail

