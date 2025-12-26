import { useQuery } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, Calendar, User, Eye, Newspaper } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'

const NewsDetail = () => {
  const { id } = useParams()

  const { data: news, isLoading } = useQuery(
    ['news', id],
    () => api.get(`/news/${id}`).then((res) => res.data.data),
    { enabled: !!id }
  )

  if (isLoading) {
    return <Loading fullScreen />
  }

  if (!news) {
    return <div className="text-center py-12">News not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/news"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to News
      </Link>

      <article className="card">
        <div className="relative w-full h-64 rounded-lg mb-6 overflow-hidden">
          {news.imageUrl ? (
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                const placeholder = e.target.parentElement?.querySelector('.news-placeholder');
                if (placeholder) placeholder.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center bg-slate-100 news-placeholder ${news.imageUrl ? 'hidden' : ''}`}>
            <Newspaper size={64} className="text-slate-400" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 text-sm font-semibold rounded bg-primary-100 text-primary-800">
              {news.category || 'General'}
            </span>
            <span className="px-3 py-1 text-sm font-semibold rounded bg-gray-100 text-gray-800">
              {news.priority}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900">{news.title}</h1>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>
                {news.Author?.firstName} {news.Author?.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{format(new Date(news.createdAt), 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>{news.views} views</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{news.content}</p>
          </div>
        </div>
      </article>
    </div>
  )
}

export default NewsDetail

