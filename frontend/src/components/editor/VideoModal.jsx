import { useState, useRef, useCallback } from 'react';
import { Video } from 'lucide-react';
import toast from 'react-hot-toast';

const VideoModal = ({ 
  isOpen, 
  onClose, 
  editor 
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef(null);

  const handleVideoFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file (MP4, WebM, MOV, etc.)');
      return;
    }

    // Validate file size (max 50MB for videos)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('Video size should be less than 50MB. Consider compressing the video or using a video hosting service.');
      return;
    }

    // Warn for large files (over 20MB)
    if (file.size > 20 * 1024 * 1024) {
      const proceed = window.confirm(
        'This video is quite large. Converting to base64 may take some time and increase the file size. Do you want to continue?'
      );
      if (!proceed) {
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
        return;
      }
    }

    setUploadingVideo(true);
    const loadingToast = toast.loading('Processing video... This may take a moment for large files.');

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Video = e.target?.result;
      if (base64Video && editor) {
        // Insert video with base64 data URL
        editor.chain().focus().setVideo({ 
          src: base64Video, 
          width: '100%', 
          height: '450px',
          controls: true,
          isIframe: false,
        }).run();
        
        setUploadingVideo(false);
        onClose();
        toast.dismiss(loadingToast);
        toast.success('Video uploaded successfully!');
      }
    };
    reader.onerror = () => {
      toast.dismiss(loadingToast);
      toast.error('Failed to read video file. Please try again or use a smaller video.');
      setUploadingVideo(false);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, [editor, onClose]);

  const triggerVideoInput = useCallback(() => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  }, []);

  const handleVideoInsert = useCallback(() => {
    if (videoUrl.trim() && editor) {
      // Check if it's a YouTube URL
      const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
      const match = videoUrl.match(youtubeRegex);
      
      if (match) {
        // YouTube embed - use iframe
        const videoId = match[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        editor.chain().focus().setVideo({ 
          src: embedUrl, 
          width: '100%', 
          height: '450px',
          isIframe: true,
          allowfullscreen: true,
        }).run();
      } else {
        // Regular video URL - use video tag
        editor.chain().focus().setVideo({ 
          src: videoUrl, 
          width: '100%', 
          height: '400px',
          controls: true,
          isIframe: false,
        }).run();
      }
      setVideoUrl('');
      onClose();
    }
  }, [editor, videoUrl, onClose]);

  const handleClose = useCallback(() => {
    setVideoUrl('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#ff4701] bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-h2 mb-4 text-gray-800">Insert Video</h3>
          
          {/* File Upload Option */}
          <div className="mb-4">
            <label className="block text-button text-gray-700 mb-2">
              Upload from Device
            </label>
            <button
              type="button"
              onClick={triggerVideoInput}
              disabled={uploadingVideo}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-slate-600 transition-colors flex items-center justify-center gap-2 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingVideo ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Choose Video from Device</span>
                </>
              )}
            </button>
            <p className="text-overline text-gray-500 mt-2 text-center">
              Supports MP4, WebM, MOV (max 50MB)
            </p>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-caption">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* URL Input Option */}
          <div className="mb-4">
            <label className="block text-button text-gray-700 mb-2">
              Enter Video URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube URL or direct video link"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
              onKeyPress={(e) => e.key === 'Enter' && handleVideoInsert()}
            />
            <p className="text-overline text-gray-500 mt-2">
              Supports YouTube URLs and direct video links
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleVideoInsert}
              disabled={!videoUrl.trim()}
              className="flex-1 px-4 py-2 bg-[#ff4701] text-white rounded-lg hover:bg-[#ff5500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Insert URL
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoFileSelect}
        accept="video/*"
        capture="environment"
        className="hidden"
        aria-label="Upload video"
      />
    </>
  );
};

export default VideoModal;

