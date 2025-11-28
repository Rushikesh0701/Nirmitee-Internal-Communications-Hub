import React from 'react'
import { Calendar, User, Award, Star } from 'lucide-react'
import { format } from 'date-fns'

const RecognitionCard = ({ item }) => {
  const categoryColors = {
    achievement: 'bg-yellow-100 text-yellow-800',
    teamwork: 'bg-blue-100 text-blue-800',
    innovation: 'bg-purple-100 text-purple-800',
    leadership: 'bg-red-100 text-red-800',
    customer_service: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
            Recognition
          </span>
          {item.category && (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                categoryColors[item.category] || categoryColors.other
              }`}
            >
              {item.category}
            </span>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-gray-600 line-clamp-3">{item.content}</p>
        {item.badge && (
          <div className="flex items-center gap-2">
            <Award size={16} className="text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">{item.badge}</span>
          </div>
        )}
        {item.points > 0 && (
          <div className="flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">{item.points} points</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <User size={16} />
            <span>
              {item.author?.firstName} {item.author?.lastName}
            </span>
            <span className="text-gray-400">→</span>
            <span>
              {item.recipient?.firstName} {item.recipient?.lastName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(RecognitionCard)

