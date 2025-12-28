import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { Award, Download, Share2, Calendar, User, BookOpen, ArrowLeft, CheckCircle } from 'lucide-react'
import { DetailSkeleton } from '../../components/skeletons'
import EmptyState from '../../components/EmptyState'
import { format } from 'date-fns'

const CertificateView = () => {
  const { certificateNumber } = useParams()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const { data, isLoading, error } = useQuery(
    ['certificate', certificateNumber],
    () => api.get(`/learning/certificates/${certificateNumber}/view`).then((res) => res.data.data),
    { enabled: !!certificateNumber, retry: 1 }
  )

  const certificate = data

  useEffect(() => {
    if (certificate) {
      document.title = `Certificate - ${certificate.certificateNumber}`
    }
  }, [certificate])

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    // TODO: Implement PDF download when PDF generation is available
    alert('PDF download will be available once PDF generation is implemented')
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (error || !certificate) {
    return (
      <div className="space-y-3">
        <Link to="/learning" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
          <ArrowLeft size={18} />
          Back to Learning
        </Link>
        <EmptyState
          icon={Award}
          title="Certificate not found"
          message="The certificate you're looking for doesn't exist or has been removed"
        />
      </div>
    )
  }

  const user = certificate.userId || certificate.user
  const course = certificate.courseId || certificate.course

  return (
    <motion.div 
      className="space-y-3" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link to="/learning" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
          <ArrowLeft size={18} />
          Back to Learning
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <Share2 size={16} />
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-[#151a28] text-white rounded-lg hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Certificate Display */}
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200">
          {/* Certificate Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
              <Award size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Certificate of Completion</h1>
            <p className="text-slate-600">This is to certify that</p>
          </div>

          {/* Recipient Name */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-slate-800 mb-2">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-lg text-slate-600">has successfully completed</p>
          </div>

          {/* Course Details */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-slate-800 mb-4">{course?.title}</h3>
            {course?.description && (
              <p className="text-slate-600 max-w-2xl mx-auto">{course.description}</p>
            )}
          </div>

          {/* Certificate Details */}
          <div className="border-t border-b border-slate-300 py-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                  <Calendar size={18} />
                  <span className="text-sm font-medium">Issued On</span>
                </div>
                <p className="text-lg font-semibold text-slate-800">
                  {format(new Date(certificate.issuedAt), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                  <Award size={18} />
                  <span className="text-sm font-medium">Certificate Number</span>
                </div>
                <p className="text-lg font-semibold text-slate-800 font-mono">
                  {certificate.certificateNumber}
                </p>
              </div>
              {certificate.grade && (
                <div>
                  <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">Grade</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800">{certificate.grade}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              This certificate is issued by Nirmitee Internal Communications Hub
            </p>
            {certificate.certificateUrl && (
              <p className="text-xs text-slate-400 mt-2">
                Verify at: {certificate.certificateUrl}
              </p>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a digital certificate. PDF download will be available once PDF generation is implemented.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default CertificateView

