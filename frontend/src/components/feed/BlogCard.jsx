import { Link } from 'react-router-dom'
import { Calendar, User, Tag, Eye, Heart } from 'lucide-react'
import { format } from 'date-fns'

const BlogCard = ({ item }) => {
  const blogId = item._id || item.id;
  
  if (!blogId) {
    return null; // Don't render if no ID
  }
  
  return (
    <Link
      to={`/blogs/${blogId}`}
      className="card hover:shadow-lg transition-shadow block"
    >
      {item.coverImage && (
        <img
          src={item.coverImage}
          alt={item.title}
          className="w-full h-64 object-cover rounded-lg mb-4"
        />
      )}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
            Blog
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="text-gray-600 line-clamp-3">{item.excerpt}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
              >
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <User size={16} />
            <span>
              {item.author?.firstName} {item.author?.lastName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={16} />
            <span>{item.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={16} />
            <span>{item.likes || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BlogCard

