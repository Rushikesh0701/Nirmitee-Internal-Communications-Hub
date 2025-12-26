import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import VideoExtension from '../editor/VideoExtension';
import FontStyleExtension from '../editor/FontStyleExtension';
import EditorStyles from '../editor/EditorStyles';
import EditorMenuBar from '../editor/EditorMenuBar';
import ImageModal from '../editor/ImageModal';
import VideoModal from '../editor/VideoModal';
import LinkModal from '../editor/LinkModal';
import EditorContextMenu from '../editor/EditorContextMenu';
import { useTheme } from '../../contexts/ThemeContext';

const Editor = ({ 
  content = '', 
  onChange = () => {}, 
  onSave = () => {},
  placeholder = 'Start writing your blog post...',
  editable = true,
}) => {
  const { theme } = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null); // Store image node being edited
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-gray-100 rounded-lg p-4 font-mono text-sm',
          },
        },
        // Disable extensions that we're adding explicitly to avoid duplicates
        link: false,
        underline: false,
        heading: false, // Disable headings
      }),
      Underline,
      Color.configure({ types: ['textStyle'] }),
      FontStyleExtension,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'blog-image',
        },
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {}
                }
                return { style: attributes.style }
              },
            },
            alt: {
              default: null,
            },
          }
        },
      }),
      VideoExtension,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'blog-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['paragraph', 'tableCell'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange({
        html: editor.getHTML(),
        json: editor.getJSON(),
      });
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] px-4 py-3',
      },
      transformPastedHTML(html) {
        // Normalize line breaks - replace multiple <br> tags and empty paragraphs with single line breaks
        let normalized = html
          .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>') // Multiple <br> tags to single
          .replace(/<p>\s*<\/p>/gi, '') // Remove empty paragraphs
          .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<br>') // Paragraphs with only <br> to <br>
          .replace(/<\/p>\s*<p>/gi, '</p><p>'); // Normalize spacing between paragraphs
        
        return normalized;
      },
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if content has actually changed
      // Handle both HTML and plain text content
      if (content !== currentContent) {
        // If content is plain text (doesn't start with <), convert it to HTML
        if (content && !content.trim().startsWith('<')) {
          editor.commands.setContent(`<p>${content}</p>`);
        } else {
          editor.commands.setContent(content || '');
        }
      }
    }
  }, [content, editor]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event) => {
      // Use metaKey for Mac (Command) and ctrlKey for Windows/Linux
      const modKey = event.metaKey || event.ctrlKey;
      
      // Bold: Ctrl/Cmd + B
      if (modKey && (event.key === 'b' || event.key === 'B')) {
        event.preventDefault();
        editor.chain().focus().toggleBold().run();
      }
      // Italic: Ctrl/Cmd + I
      if (modKey && (event.key === 'i' || event.key === 'I')) {
        event.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }
      // Underline: Ctrl/Cmd + U
      if (modKey && (event.key === 'u' || event.key === 'U')) {
        event.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      }
      // Undo: Ctrl/Cmd + Z
      if (modKey && (event.key === 'z' || event.key === 'Z') && !event.shiftKey) {
        event.preventDefault();
        editor.chain().focus().undo().run();
      }
      // Redo: Ctrl/Cmd + Shift + Z
      if (modKey && (event.key === 'z' || event.key === 'Z') && event.shiftKey) {
        event.preventDefault();
        editor.chain().focus().redo().run();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // Handle image clicks for editing
  useEffect(() => {
    if (!editor || !editor.view || !editor.view.dom) return;

    const handleImageClick = (event) => {
      const target = event.target;
      if (target.tagName === 'IMG' && target.closest('.tiptap-editor')) {
        event.preventDefault();
        event.stopPropagation();
        
        // Find the image node in the editor
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Try to find image node at current position
        let imageNode = null;
        let imagePos = null;
        
        // Check node at current position
        const node = $from.node();
        if (node && node.type.name === 'image') {
          imageNode = node;
          imagePos = $from.pos;
        } else {
          // Search for image node in the document
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'image' && node.attrs.src === target.src) {
              imageNode = node;
              imagePos = pos;
              return false; // Stop searching
            }
          });
        }
        
        if (imageNode && imagePos !== null) {
          // Get image attributes
          const attrs = imageNode.attrs;
          const style = attrs.style || '';
          
          // Parse style to extract settings
          let width = 'auto';
          let height = 'auto';
          let align = 'center';
          
          // Extract width
          const widthMatch = style.match(/width:\s*([^;]+)/);
          if (widthMatch) {
            width = widthMatch[1].trim();
          }
          
          // Extract height
          const heightMatch = style.match(/height:\s*([^;]+)/);
          if (heightMatch) {
            height = heightMatch[1].trim();
          }
          
          // Determine alignment
          if (style.includes('float: left')) {
            align = 'float-left';
          } else if (style.includes('float: right')) {
            align = 'float-right';
          } else if (style.includes('margin-left: 0') || style.includes('margin-left:0')) {
            align = 'left';
          } else if (style.includes('margin-right: 0') || style.includes('margin-right:0')) {
            align = 'right';
          } else {
            align = 'center';
          }
          
          // Store editing image data
          setEditingImage({
            src: attrs.src,
            width,
            height,
            align,
            nodePos: imagePos
          });
          
          // Select the image node
          editor.chain().focus().setNodeSelection(imagePos).run();
          
          setShowImageModal(true);
        }
      }
    };

    const editorElement = editor.view.dom;
    if (editorElement) {
      editorElement.addEventListener('click', handleImageClick, true);
      
      return () => {
        if (editorElement) {
          editorElement.removeEventListener('click', handleImageClick, true);
        }
      };
    }
  }, [editor]);

  // Handle right-click context menu
  useEffect(() => {
    if (!editor || !editor.view || !editor.view.dom) return;

    const handleContextMenu = (event) => {
      // Check if there's selected text
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;
      
      // Only show context menu if text is selected
      if (from === to) {
        // No text selected, allow default context menu
        return;
      }

      // Prevent default browser context menu
      event.preventDefault();
      event.stopPropagation();

      // Position menu near cursor
      setContextMenuPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setShowContextMenu(true);
    };

    const handleSelectionChange = () => {
      // Hide context menu when selection is cleared
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;
      
      if (from === to && showContextMenu) {
        setShowContextMenu(false);
      }
    };

    const handleScroll = () => {
      // Hide context menu on scroll
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    const editorElement = editor.view.dom;
    if (editorElement) {
      editorElement.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('selectionchange', handleSelectionChange);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        if (editorElement) {
          editorElement.removeEventListener('contextmenu', handleContextMenu);
        }
        document.removeEventListener('selectionchange', handleSelectionChange);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [editor, showContextMenu]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    const data = {
      html: editor.getHTML(),
      json: editor.getJSON(),
    };
    onSave(data);
  }, [editor, onSave]);

  const handleTogglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  const handleImageClick = useCallback(() => {
    setShowImageModal(true);
  }, []);

  const handleVideoClick = useCallback(() => {
    setShowVideoModal(true);
  }, []);

  const handleLinkClick = useCallback(() => {
    setShowLinkModal(true);
  }, []);

  const handleImageModalClose = useCallback(() => {
    setShowImageModal(false);
    setEditingImage(null);
  }, []);

  const handleVideoModalClose = useCallback(() => {
    setShowVideoModal(false);
  }, []);

  const handleLinkModalClose = useCallback(() => {
    setShowLinkModal(false);
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  if (!editor) {
    return <div className="p-4 text-center text-gray-500">Loading editor...</div>;
  }

  return (
    <div className="w-full">
      <EditorStyles />
      <EditorMenuBar 
        editor={editor}
        onImageClick={handleImageClick}
        onVideoClick={handleVideoClick}
        onLinkClick={handleLinkClick}
        onSave={handleSave}
        showPreview={showPreview}
        onTogglePreview={handleTogglePreview}
      />
      
      {/* Editor Content */}
      {!showPreview && (
        <div className={`border border-t-0 rounded-b-lg min-h-[400px] ${
          theme === 'dark'
            ? 'border-slate-700/50 bg-slate-800/50'
            : 'border-gray-200 bg-white'
        }`}>
          <div className="tiptap-editor">
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className={`border border-t-0 rounded-b-lg p-4 min-h-[400px] ${
          theme === 'dark'
            ? 'border-slate-700/50 bg-slate-800/50 text-slate-200'
            : 'border-gray-200 bg-white text-gray-800'
        }`}>
          <div 
            className="tiptap-editor max-w-none"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }} 
          />
        </div>
      )}

      {/* Modals */}
      <ImageModal
        isOpen={showImageModal}
        onClose={handleImageModalClose}
        onInsert={handleImageClick}
        editor={editor}
        editingImage={editingImage}
        onEditComplete={() => setEditingImage(null)}
      />
      <VideoModal
        isOpen={showVideoModal}
        onClose={handleVideoModalClose}
        editor={editor}
      />
      <LinkModal
        isOpen={showLinkModal}
        onClose={handleLinkModalClose}
        editor={editor}
      />
      
      {/* Context Menu */}
      <EditorContextMenu
        editor={editor}
        position={contextMenuPosition}
        isVisible={showContextMenu}
        onClose={handleContextMenuClose}
        onLinkClick={handleLinkClick}
      />
    </div>
  );
};

export default Editor;

