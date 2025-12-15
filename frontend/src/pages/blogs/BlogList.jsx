import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Calendar, User, Tag } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'

const BlogList = () => {
  const { data, isLoading } = useQuery('blogs', () =>
    api.get('/blogs?published=true').then((res) => res.data.data),
    { refetchOnMount: 'always' }
  )

  if (isLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600 mt-1">Read and share insights</p>
        </div>
        <Link to="/blogs/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Write Blog
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.blogs?.map((blog) => {
          const blogId = blog._id || blog.id;
          if (!blogId) return null; // Skip blogs without ID
          return (
          <Link
            key={blogId}
            to={`/blogs/${blogId}`}
            className="card hover:shadow-lg transition-shadow"
          >
            {blog.coverImage && (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {blog.title}
              </h3>
              {blog.excerpt && (
                <p className="text-gray-600 line-clamp-3">{blog.excerpt}</p>
              )}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blog.tags.slice(0, 3).map((tag, idx) => (
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
              <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                <div className="flex items-center gap-1">
                  <User size={16} />
                  <span>
                    {blog.Author?.firstName} {blog.Author?.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{format(new Date(blog.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>

      {!data?.blogs?.length && (
        <div className="text-center py-12 text-gray-500">
          No blogs available yet
        </div>
      )}
    </div>
  )
}

export default BlogList

