import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { learningApi } from '../../services/learningApi';
import { 
  Award, 
  Download, 
  Calendar,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { DetailSkeleton } from '../../components/skeletons';
import EmptyState from '../../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyCertificates = () => {
  const navigate = useNavigate();

  // Fetch user's certificates
  const { data: certificates, isLoading } = useQuery(
    'my-certificates',
    () => learningApi.getUserCertificates().then(res => res.data?.data || res.data || [])
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleViewCertificate = (certificateNumber) => {
    navigate(`/learning/certificates/${certificateNumber}`);
  };

  const handleDownloadCertificate = async (certificateNumber) => {
    // TODO: Implement PDF download when backend supports it
    toast.error('Certificate download will be available soon');
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-h1 text-slate-800 dark:text-slate-200">
              My Certificates
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              View and manage your course completion certificates
            </p>
          </div>
        </div>
        <Link to="/learning/my-progress" className="btn-secondary flex items-center gap-2">
          <BookOpen size={16} />
          My Progress
        </Link>
      </div>

      {/* Certificates List */}
      {isLoading ? (
        <DetailSkeleton />
      ) : certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((certificate) => {
            const course = certificate.course || {};
            return (
              <motion.div
                key={certificate._id || certificate.id}
                className="card hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col h-full">
                  {/* Certificate Icon */}
                  <div className="flex items-center justify-center p-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mb-4">
                    <Award size={48} className="text-white" />
                  </div>

                  {/* Certificate Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">
                      {course.title || 'Course Certificate'}
                    </h3>
                    <p className="text-caption text-slate-600 dark:text-slate-400 mb-4">
                      Certificate of Completion
                    </p>
                    
                    {/* Certificate Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-caption text-slate-600 dark:text-slate-400">
                        <Calendar size={14} />
                        <span>Issued: {formatDate(certificate.issuedAt || certificate.createdAt)}</span>
                      </div>
                      {certificate.certificateNumber && (
                        <div className="text-overline text-slate-500 dark:text-slate-500">
                          Certificate #: {certificate.certificateNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewCertificate(certificate.certificateNumber || certificate._id)}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Award size={16} />
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadCertificate(certificate.certificateNumber || certificate._id)}
                      className="btn-secondary flex items-center justify-center gap-2 px-4"
                      title="Download PDF (Coming soon)"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          message="Complete courses to earn certificates"
          action={
            <Link to="/learning" className="btn-primary">
              Browse Courses
            </Link>
          }
        />
      )}

      {/* Summary Stats */}
      {certificates && certificates.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {certificates.length}
              </p>
              <p className="text-caption text-slate-600 dark:text-slate-400 mt-1">
                Total Certificates
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {new Set(certificates.map(c => c.course?._id || c.course?.id)).size}
              </p>
              <p className="text-caption text-slate-600 dark:text-slate-400 mt-1">
                Unique Courses
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MyCertificates;

