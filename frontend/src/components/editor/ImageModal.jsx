import { useState, useRef, useCallback, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageModal = ({ 
  isOpen, 
  onClose, 
  editor,
  editingImage = null,
  onEditComplete = () => {}
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSettings, setImageSettings] = useState({
    width: 'auto',
    height: 'auto',
    align: 'center'
  });
  const fileInputRef = useRef(null);

  // Initialize settings from editingImage when modal opens
  useEffect(() => {
    if (isOpen && editingImage) {
      setImageSettings({
        width: editingImage.width || 'auto',
        height: editingImage.height || 'auto',
        align: editingImage.align || 'center'
      });
      setImageUrl(editingImage.src || '');
    } else if (isOpen && !editingImage) {
      // Reset to defaults when opening for new image
      setImageSettings({
        width: 'auto',
        height: 'auto',
        align: 'center'
      });
      setImageUrl('');
    }
  }, [isOpen, editingImage]);

  const insertImageWithSettings = useCallback((src) => {
    if (!editor || !src) return;

    // Build style string based on settings
    let styleString = '';
    
    // Handle alignment
    switch(imageSettings.align) {
      case 'left':
        styleString += 'display: block; margin-left: 0; margin-right: auto;';
        break;
      case 'right':
        styleString += 'display: block; margin-left: auto; margin-right: 0;';
        break;
      case 'center':
        styleString += 'display: block; margin-left: auto; margin-right: auto;';
        break;
      case 'float-left':
        styleString += 'float: left; margin-right: 20px; margin-bottom: 10px;';
        break;
      case 'float-right':
        styleString += 'float: right; margin-left: 20px; margin-bottom: 10px;';
        break;
    }

    // Add width
    if (imageSettings.width && imageSettings.width !== 'auto') {
      // Check if it's a number (add px) or already has a unit
      const width = imageSettings.width.toString().match(/\d+$/) 
        ? `${imageSettings.width}px` 
        : imageSettings.width;
      styleString += ` width: ${width};`;
    }

    // Add height
    if (imageSettings.height && imageSettings.height !== 'auto') {
      const height = imageSettings.height.toString().match(/\d+$/) 
        ? `${imageSettings.height}px` 
        : imageSettings.height;
      styleString += ` height: ${height};`;
    }

    // Add max-height for better display
    if (imageSettings.height === 'auto') {
      styleString += ' max-height: 600px;';
    }

    // Add object-fit to maintain aspect ratio
    styleString += ' object-fit: contain;';

    // If editing an existing image, update it; otherwise insert new
    if (editingImage && editingImage.nodePos !== undefined) {
      // Update existing image: select it, delete it, then insert updated version
      const pos = editingImage.nodePos;
      const { state } = editor;
      
      // Get the image node to find its size
      const imageNode = state.doc.nodeAt(pos);
      if (imageNode) {
        // Select the image node
        editor.chain()
          .focus()
          .setNodeSelection(pos)
          .deleteSelection()
          .setImage({ 
            src: src,
            style: styleString.trim(),
            alt: 'Blog image'
          })
          .run();
      }
    } else {
      // Insert new image with custom attributes
      editor.chain().focus().setImage({ 
        src: src,
        style: styleString.trim(),
        alt: 'Blog image'
      }).run();
    }

  }, [editor, imageSettings, editingImage]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setUploadingImage(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result;
      if (base64Image) {
        insertImageWithSettings(base64Image);
        setUploadingImage(false);
        onClose();
        onEditComplete();
        // Reset settings
        setImageSettings({ width: 'auto', height: 'auto', align: 'center' });
        setImageUrl('');
        toast.success(editingImage ? 'Image updated successfully!' : 'Image uploaded successfully!');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file. Please try again.');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [insertImageWithSettings, onClose, editingImage, onEditComplete]);

  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleImageInsert = useCallback(() => {
    if (imageUrl.trim()) {
      insertImageWithSettings(imageUrl);
      setImageUrl('');
      setImageSettings({ width: 'auto', height: 'auto', align: 'center' });
      onClose();
      onEditComplete();
      toast.success(editingImage ? 'Image updated successfully!' : 'Image inserted successfully!');
    }
  }, [imageUrl, insertImageWithSettings, onClose, onEditComplete, editingImage]);

  const handleClose = useCallback(() => {
    setImageUrl('');
    setImageSettings({ width: 'auto', height: 'auto', align: 'center' });
    onClose();
    onEditComplete();
  }, [onClose, onEditComplete]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#ff4701] bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4 my-8">
          <h3 className="text-h2 mb-4 text-gray-800">
            {editingImage ? '✏️ Edit Image' : 'Insert Image'}
          </h3>
          
          {/* File Upload Option - Only show for new images */}
          {!editingImage && (
          <div className="mb-4">
              <label className="block text-button text-gray-700 mb-2">
              Upload from Device
            </label>
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploadingImage}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-slate-600 transition-colors flex items-center justify-center gap-2 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImage ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span>Choose Image from Device</span>
                </>
              )}
            </button>
              <p className="text-overline text-gray-500 mt-2 text-center">
              Supports JPG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>
          )}

          {/* Divider - Only show for new images */}
          {!editingImage && (
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-caption">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>
          )}

          {/* URL Input Option */}
          <div className="mb-4">
            <label className="block text-button text-gray-700 mb-2">
              {editingImage ? 'Image URL' : 'Enter Image URL'}
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
              onKeyPress={(e) => e.key === 'Enter' && handleImageInsert()}
            />
          </div>

          {/* Customization Options */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h4 className="text-caption text-gray-700 mb-3">📐 Customize Size & Position</h4>
            
            {/* Size Controls */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-overline text-gray-600 mb-1">
                  Width
                </label>
                <input
                  type="text"
                  value={imageSettings.width}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, width: e.target.value }))}
                  placeholder="auto, 400px, 50%"
                  className="w-full px-3 py-2 text-caption border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
                />
                <p className="text-overline text-gray-500 mt-1">e.g., auto, 400px, 50%</p>
              </div>
              <div>
                <label className="block text-overline text-gray-600 mb-1">
                  Height
                </label>
                <input
                  type="text"
                  value={imageSettings.height}
                  onChange={(e) => setImageSettings(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="auto, 300px, 400px"
                  className="w-full px-3 py-2 text-caption border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 bg-white text-gray-900"
                />
                <p className="text-overline text-gray-500 mt-1">e.g., auto, 300px</p>
              </div>
            </div>

            {/* Position/Alignment Controls */}
            <div>
              <label className="block text-overline text-gray-600 mb-2">
                Position
              </label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setImageSettings(prev => ({ ...prev, align: 'left' }))}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    imageSettings.align === 'left' 
                      ? 'bg-[#ff4701] text-white border-[#ff4701]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-slate-500'
                  }`}
                  title="Align Left"
                >
                  ⬅️ Left
                </button>
                <button
                  type="button"
                  onClick={() => setImageSettings(prev => ({ ...prev, align: 'center' }))}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    imageSettings.align === 'center' 
                      ? 'bg-[#ff4701] text-white border-[#ff4701]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-slate-500'
                  }`}
                  title="Center"
                >
                  ↔️ Center
                </button>
                <button
                  type="button"
                  onClick={() => setImageSettings(prev => ({ ...prev, align: 'right' }))}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    imageSettings.align === 'right' 
                      ? 'bg-[#ff4701] text-white border-[#ff4701]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-slate-500'
                  }`}
                  title="Align Right"
                >
                  ➡️ Right
                </button>
                <button
                  type="button"
                  onClick={() => setImageSettings(prev => ({ ...prev, align: 'float-left' }))}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    imageSettings.align === 'float-left' 
                      ? 'bg-[#ff4701] text-white border-[#ff4701]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-slate-500'
                  }`}
                  title="Float Left (text wraps around right)"
                >
                  📄⬅️ Float L
                </button>
                <button
                  type="button"
                  onClick={() => setImageSettings(prev => ({ ...prev, align: 'float-right' }))}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    imageSettings.align === 'float-right' 
                      ? 'bg-[#ff4701] text-white border-[#ff4701]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-slate-500'
                  }`}
                  title="Float Right (text wraps around left)"
                >
                  ➡️📄 Float R
                </button>
              </div>
              <p className="text-overline text-gray-500 mt-2">
                💡 <strong>Float</strong> allows text to wrap around the image
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImageInsert}
              disabled={!imageUrl.trim()}
              className="flex-1 px-4 py-2 bg-[#ff4701] text-white rounded-lg hover:bg-[#ff5500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingImage ? 'Update Image' : 'Insert Image'}
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
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Upload image"
      />
    </>
  );
};

export default ImageModal;
