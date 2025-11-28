import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User, Tag, Clock } from 'lucide-react'
import { format } from 'date-fns'

const AnnouncementCard = ({ item }) => {
  return (
    <Link
      to={`/announcements/${item.id}`}
      className="card hover:shadow-lg transition-shadow block"
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-64 object-cover rounded-lg mb-4"
        />
      )}
      <div className="space-y-3">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-primary-100 text-primary-800"
              >
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
            Announcement
          </span>
          {item.scheduledAt && !item.isPublished && (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">
              Scheduled
            </span>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-gray-600 line-clamp-3 text-sm">
          {item.content?.replace(/<[^>]*>/g, '').substring(0, 200)}...
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <User size={16} />
            <span>
              {item.author?.firstName} {item.author?.lastName}
            </span>
          </div>
          {item.scheduledAt ? (
            <div className="flex items-center gap-1 text-orange-600">
              <Clock size={16} />
              <span>{format(new Date(item.scheduledAt), 'MMM d, yyyy')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default React.memo(AnnouncementCard)

