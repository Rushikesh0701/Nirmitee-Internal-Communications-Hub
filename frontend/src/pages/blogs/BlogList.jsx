import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { Plus, Calendar, User, Tag, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const BlogList = () => {
  const { data, isLoading } = useQuery('blogs', () =>
    api.get('/blogs?published=true').then((res) => res.data.data),
    { refetchOnMount: 'always' }
  )

  if (isLoading) return <Loading fullScreen />

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Blogs</h1>
            <p className="text-slate-500 text-sm mt-0.5">Read and share insights with your team</p>
          </div>
        </div>
        <Link to="/blogs/new" className="btn btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} /> Write Blog
        </Link>
      </motion.div>

      {/* Blog Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants}>
        {data?.blogs?.map((blog, index) => {
          const blogId = blog._id || blog.id;
          if (!blogId) return null;
          
          return (
            <motion.div key={blogId} variants={itemVariants} custom={index} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Link to={`/blogs/${blogId}`} className="card-hover block group overflow-hidden">
                {blog.coverImage && (
                  <div className="relative -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl">
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                )}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {blog.title}
                  </h3>
                  {blog.excerpt && <p className="text-slate-500 text-sm line-clamp-2">{blog.excerpt}</p>}
                  {blog.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="badge badge-success"><Tag size={10} /> {tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <User size={14} />
                      <span>{blog.Author?.firstName} {blog.Author?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{format(new Date(blog.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {!data?.blogs?.length && (
        <motion.div variants={itemVariants} className="empty-state">
          <BookOpen size={56} className="empty-state-icon" />
          <h3 className="empty-state-title">No blogs yet</h3>
          <p className="empty-state-text mb-6">Be the first to share your insights!</p>
          <Link to="/blogs/new" className="btn btn-primary inline-flex items-center gap-2">
            <Plus size={18} /> Write the First Blog
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}

export default BlogList
