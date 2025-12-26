import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { blogAPI } from '../../services/blogApi';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useBlogMutations } from '../../hooks/useBlogMutations';
import CommentsSection from '../../components/blog/CommentsSection';
import BlogActions from '../../components/blog/BlogActions';
import DraftBanner from '../../components/blog/DraftBanner';
import { isValidBlogId, checkIfLiked, checkIsOwner, checkCanEdit, isDraft as checkIsDraft, formatDate, getAuthorName, extractId } from '../../utils/blogHelpers';
import { sanitizeHtml } from '../../utils/sanitize';
import '../../styles/blog-content.css';
import { DetailSkeleton } from '../../components/skeletons';
import { ArrowLeft, BookOpen, Calendar, Heart, MessageCircle, Tag } from 'lucide-react';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, requireAuth } = useAuthGuard();
  const { toggleBookmark, isBookmarked } = useBookmarks();

  const { data: blog, isLoading, error } = useQuery(['blog', id], async () => {
    const response = await blogAPI.getById(id);
    return response.data?.data || response.data || response;
  }, { enabled: isValidBlogId(id), staleTime: 30000 });

  const { likeMutation, addCommentMutation, deleteCommentMutation, deleteBlogMutation, publishMutation } = useBlogMutations(id);

  const computedValues = useMemo(() => {
    if (!blog) return null;
    return {
      isLiked: checkIfLiked(blog, user), isOwner: checkIsOwner(blog, user), canEdit: checkCanEdit(blog, user),
      isDraft: checkIsDraft(blog), isBookmarked: isBookmarked(extractId(blog)), authorName: getAuthorName(blog),
      sanitizedContent: sanitizeHtml(blog.content)
    };
  }, [blog, user, isBookmarked]);

  if (!isValidBlogId(id)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="empty-state">
          <BookOpen size={56} className="empty-state-icon" />
          <h3 className="empty-state-title">Invalid Blog ID</h3>
          <p className="empty-state-text mb-4">The blog ID is missing or invalid.</p>
          <Link to="/blogs" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 justify-center"><ArrowLeft size={18} /> Back to Blogs</Link>
        </div>
      </div>
    );
  }

  const handleLike = () => { if (!requireAuth('Please login to like posts')) return; likeMutation.mutate(); };
  const handleBookmark = () => { if (!requireAuth('Please login to bookmark posts')) return; const isNowBookmarked = toggleBookmark(extractId(blog)); toast.success(isNowBookmarked ? 'Bookmarked!' : 'Removed from bookmarks'); };
  const handleAddComment = ({ content, parentCommentId, onComplete }) => { if (!requireAuth('Please login to comment')) return; addCommentMutation.mutate({ content, parentCommentId, onComplete }); };
  const handleDeleteComment = (commentId) => { deleteCommentMutation.mutate(commentId); };
  const handlePublish = () => { if (!blog?.isPublished) publishMutation.mutate(true); };
  const handleUnpublish = () => { if (blog?.isPublished) publishMutation.mutate(false); };
  const handleDeleteBlog = () => { if (window.confirm('Are you sure you want to delete this blog?')) { deleteBlogMutation.mutate(undefined, { onSuccess: () => { toast.success('Blog deleted!'); navigate('/blogs'); } }); } };

  if (isLoading) return <DetailSkeleton />;

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="empty-state">
          <BookOpen size={56} className="empty-state-icon" />
          <h3 className="empty-state-title">Blog not found</h3>
          <p className="empty-state-text mb-4">The blog you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link to="/blogs" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 justify-center"><ArrowLeft size={18} /> Back to Blogs</Link>
        </div>
      </div>
    );
  }

  const { isLiked, isOwner, canEdit, isDraft, isBookmarked: bookmarked, authorName, sanitizedContent } = computedValues;

  return (
    <motion.div className="max-w-4xl mx-auto space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate('/blogs')} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 transition-colors">
        <ArrowLeft size={18} /> Back to Blogs
      </motion.button>

      {isAuthenticated && isDraft && isOwner && <DraftBanner onPublish={handlePublish} isPublishing={publishMutation.isLoading} />}

      <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-8">
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
          <span className="badge badge-primary">{blog.category || 'Uncategorized'}</span>
          <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(blog.createdAt)}</span>
          {isDraft && <span className="badge badge-warning">Draft</span>}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">{blog.title}</h1>

        <div className="flex items-center gap-4 mb-6 text-slate-500">
          <span className="font-medium text-slate-700">{authorName}</span>
          <span className="flex items-center gap-1"><Heart size={14} /> {blog.likes || 0} likes</span>
          <span className="flex items-center gap-1"><MessageCircle size={14} /> {blog.comments?.length || 0} comments</span>
        </div>

        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {blog.tags.map((tag) => <span key={tag} className="badge badge-info flex items-center gap-1"><Tag size={10} /> {tag}</span>)}
          </div>
        )}

        <div className="mb-8 prose max-w-none">
          <div className="blog-content-dark leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </div>

        <BlogActions blogId={id} isAuthenticated={isAuthenticated} isLiked={isLiked} isBookmarked={bookmarked} isDraft={isDraft} isOwner={isOwner} canEdit={canEdit} isPublished={blog.isPublished} likesCount={blog.likes || 0} onLike={handleLike} onBookmark={handleBookmark} onPublish={handlePublish} onUnpublish={handleUnpublish} onDelete={handleDeleteBlog} isLiking={likeMutation.isLoading} isPublishing={publishMutation.isLoading} isDeleting={deleteBlogMutation.isLoading} />
      </motion.article>

      <CommentsSection comments={blog.comments || []} user={user} isAuthenticated={isAuthenticated} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} isLoading={addCommentMutation.isLoading} />
    </motion.div>
  );
};

export default BlogDetail;
