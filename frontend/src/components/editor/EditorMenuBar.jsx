import { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Video,
  Code,
  Code2,
  Undo,
  Redo,
  Eraser,
  Save,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Palette,
  Type,
  Sparkles,
  Table as TableIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EditorMenuBar = ({ 
  editor, 
  onImageClick, 
  onVideoClick, 
  onLinkClick,
  onSave,
  showPreview,
  onTogglePreview 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
  
  // Close dropdowns when clicking outside - must be declared before early return
  const colorPickerRef = useRef(null);
  const fontSizePickerRef = useRef(null);
  const fontFamilyPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
      if (fontSizePickerRef.current && !fontSizePickerRef.current.contains(event.target)) {
        setShowFontSizePicker(false);
      }
      if (fontFamilyPickerRef.current && !fontFamilyPickerRef.current.contains(event.target)) {
        setShowFontFamilyPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const fontSizes = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64'];
  const fontFamilies = [
    { label: 'Default', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: '"Courier New", monospace' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
    { label: 'Impact', value: 'Impact, sans-serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  ];

  const colorGroups = [
    {
      name: 'Grayscale',
      colors: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF']
    },
    {
      name: 'Vibrant',
      colors: ['#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#0066FF', '#0000FF']
    },
    {
      name: 'Mixed',
      colors: ['#6600FF', '#FF00FF', '#FF0066', '#00FFFF', '#FFCCCC', '#FFFFCC']
    },
    {
      name: 'Pastel',
      colors: ['#CCFFCC', '#CCCCFF', '#FFCCFF', '#CCFFFF', '#FFE5CC', '#E5CCFF']
    }
  ];

  const getCurrentFontSize = () => {
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontSize || '';
  };

  const getCurrentFontFamily = () => {
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontFamily || '';
  };

  const getCurrentColor = () => {
    return editor.getAttributes('textStyle').color || '#000000';
  };

  const handleAutoFormat = () => {
    try {
      // Get current HTML content
      const html = editor.getHTML();
      
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Function to clean text nodes - remove extra spaces but preserve single spaces
      const cleanTextNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Replace multiple spaces/tabs/newlines with single space, but preserve intentional line breaks
          let text = node.textContent;
          // Replace multiple whitespace characters with single space
          text = text.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs -> single space
          // Replace multiple newlines with single space (but we'll handle line breaks separately)
          text = text.replace(/\n+/g, ' ');
          // Trim leading/trailing whitespace
          text = text.trim();
          node.textContent = text;
        }
      };
      
      // Function to clean element nodes recursively
      const cleanElement = (element) => {
        // Clean text nodes first
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip text nodes inside code blocks, pre tags, etc.
              const parent = node.parentElement;
              if (parent && (parent.tagName === 'CODE' || parent.tagName === 'PRE')) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );
        
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
          textNodes.push(node);
        }
        
        textNodes.forEach(cleanTextNode);
        
        // Process child elements recursively
        const children = Array.from(element.children);
        children.forEach(cleanElement);
        
        // Remove empty paragraphs (but keep those with br tags or media)
        if (element.tagName === 'P') {
          const hasBr = element.querySelector('br');
          const hasMedia = element.querySelector('img, video, iframe');
          const hasContent = element.textContent.trim();
          
          if (!hasContent && !hasBr && !hasMedia) {
            element.remove();
          }
        }
        
        // Remove empty list items (but keep those with media)
        if (element.tagName === 'LI') {
          const hasMedia = element.querySelector('img, video, iframe');
          const hasContent = element.textContent.trim();
          
          if (!hasContent && !hasMedia) {
            element.remove();
          }
        }
      };
      
      // Clean the entire document
      cleanElement(tempDiv);
      
      // Get cleaned HTML
      let cleanedHtml = tempDiv.innerHTML;
      
      // Remove multiple consecutive <br> tags (keep max 2 for line breaks)
      cleanedHtml = cleanedHtml.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');
      
      // Remove spaces between closing and opening tags (but preserve structure)
      cleanedHtml = cleanedHtml.replace(/>\s+</g, '><');
      
      // Remove empty paragraphs that might have been created
      cleanedHtml = cleanedHtml.replace(/<p>\s*<\/p>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<p><\/p>/gi, '');
      
      // Remove multiple consecutive empty paragraphs
      cleanedHtml = cleanedHtml.replace(/(<p>\s*<\/p>\s*){2,}/gi, '<p></p>');
      
      // Update editor with cleaned content
      editor.commands.setContent(cleanedHtml);
      
      toast.success('Content auto-formatted! Extra spaces and empty lines removed.');
    } catch (error) {
      console.error('Error auto-formatting:', error);
      toast.error('Failed to auto-format content');
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white rounded-t-lg editor-toolbar">
      <div className="flex flex-wrap items-center gap-1 p-2">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('bold') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('italic') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('underline') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('strike') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div ref={fontSizePickerRef} className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2 relative">
          <button
            type="button"
            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700 flex items-center gap-1"
            title="Font Size"
          >
            <Type className="w-4 h-4" />
            <span className="text-xs">{getCurrentFontSize() || 'Size'}</span>
          </button>
          {showFontSizePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg z-50 p-2 max-h-48 overflow-y-auto">
              <input
                type="number"
                placeholder="Enter size"
                min="8"
                max="200"
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const size = e.target.value;
                    if (size) {
                      editor.chain().focus().setFontSize(size).run();
                      setShowFontSizePicker(false);
                    }
                  }
                }}
              />
              <div className="grid grid-cols-3 gap-1">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setFontSize(size).run();
                      setShowFontSizePicker(false);
                    }}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                      getCurrentFontSize() === size ? 'bg-slate-100 text-slate-700' : ''
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Font Family */}
        <div ref={fontFamilyPickerRef} className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2 relative">
          <button
            type="button"
            onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700 flex items-center gap-1"
            title="Font Family"
          >
            <Type className="w-4 h-4" />
            <span className="text-xs max-w-[60px] truncate">
              {fontFamilies.find(f => f.value === getCurrentFontFamily())?.label || 'Font'}
            </span>
          </button>
          {showFontFamilyPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg z-50 min-w-[180px] max-h-64 overflow-y-auto">
              {fontFamilies.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => {
                    if (font.value) {
                      editor.chain().focus().setFontFamily(font.value).run();
                    } else {
                      editor.chain().focus().unsetFontFamily().run();
                    }
                    setShowFontFamilyPicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    getCurrentFontFamily() === font.value ? 'bg-slate-100 text-slate-700' : ''
                  }`}
                  style={font.value ? { fontFamily: font.value } : {}}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div ref={colorPickerRef} className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2 relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg z-50 p-3 min-w-[200px]">
              {/* Color Groups */}
              {colorGroups.map((group, groupIndex) => (
                <div key={group.name} className={groupIndex > 0 ? 'mt-3' : ''}>
                  <div className="grid grid-cols-6 gap-2">
                    {group.colors.map((color) => {
                      const isSelected = getCurrentColor().toUpperCase() === color.toUpperCase();
                      return (
                        <div key={color} className="relative group">
                          <button
                            type="button"
                            onClick={() => {
                              editor.chain().focus().setColor(color).run();
                              setShowColorPicker(false);
                            }}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              isSelected 
                                ? 'border-[#ff4701] ring-2 ring-[#ff4701]/50' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                          {/* Tooltip with hex code */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                            {color}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Custom Color Picker */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Custom Color</div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: getCurrentColor() }}
                  />
                  <input
                    type="color"
                    value={getCurrentColor()}
                    onChange={(e) => {
                      editor.chain().focus().setColor(e.target.value).run();
                    }}
                    className="flex-1 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getCurrentColor()}
                    onChange={(e) => {
                      const color = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(color)) {
                        editor.chain().focus().setColor(color).run();
                      }
                    }}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lists & Blockquote */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('bulletList') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('orderedList') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('blockquote') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Code */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('code') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('codeBlock') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Code Block"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <button
            type="button"
            onClick={onImageClick}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onVideoClick}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
            title="Insert Video"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onLinkClick}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('link') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Table Controls */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              toast.success('Table inserted');
            }}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('table') ? 'bg-slate-100 text-slate-700' : 'text-gray-700'
            }`}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          {editor.isActive('table') && (
            <>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addRowBefore().run();
                  toast.success('Row added above');
                }}
                className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                title="Add Row Above"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addRowAfter().run();
                  toast.success('Row added below');
                }}
                className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                title="Add Row Below"
              >
                <Plus className="w-3 h-3 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run();
                  toast.success('Column added left');
                }}
                className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                title="Add Column Left"
              >
                <Plus className="w-3 h-3 -rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addColumnAfter().run();
                  toast.success('Column added right');
                }}
                className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
                title="Add Column Right"
              >
                <Plus className="w-3 h-3 rotate-180" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteRow().run();
                  toast.success('Row deleted');
                }}
                className="p-2 rounded hover:bg-red-100 transition-colors text-red-600"
                title="Delete Row"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteColumn().run();
                  toast.success('Column deleted');
                }}
                className="p-2 rounded hover:bg-red-100 transition-colors text-red-600"
                title="Delete Column"
              >
                <Trash2 className="w-3 h-3 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  toast.success('Table deleted');
                }}
                className="p-2 rounded hover:bg-red-100 transition-colors text-red-600"
                title="Delete Table"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
            title="Clear Formatting"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleAutoFormat}
            className="p-2 rounded hover:bg-purple-100 transition-colors text-purple-600"
            title="Auto Format (Remove extra spaces and clean formatting)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePreview}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
            title="Toggle Preview"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="p-2 rounded hover:bg-green-100 transition-colors text-green-600"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorMenuBar;

