import { useState, useEffect, useRef } from 'react';
import {
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Eraser,
} from 'lucide-react';

const EditorContextMenu = ({ 
  editor, 
  position, 
  isVisible, 
  onClose,
  onLinkClick 
}) => {
  const menuRef = useRef(null);
  const fontSizePickerRef = useRef(null);
  const colorPickerRef = useRef(null);
  
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
      if (fontSizePickerRef.current && !fontSizePickerRef.current.contains(event.target)) {
        setShowFontSizePicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    // Add a small delay to prevent immediate closing when menu opens
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // Close menu on Escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowFontSizePicker(false);
        setShowColorPicker(false);
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible || !editor) return null;

  // Adjust position to keep menu within viewport
  const adjustPosition = () => {
    if (!menuRef.current) return position;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }

    // Adjust vertical position
    if (y + menuRect.height > viewportHeight) {
      y = y - menuRect.height - 10;
    }
    if (y < 10) {
      y = 10;
    }

    return { x, y };
  };

  const adjustedPosition = menuRef.current ? adjustPosition() : position;

  // Font sizes
  const fontSizes = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64'];
  
  // Color groups
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

  const getCurrentColor = () => {
    return editor.getAttributes('textStyle').color || '#000000';
  };

  const menuItems = [
    {
      icon: AlignLeft,
      label: 'Align Left',
      action: () => {
        editor.chain().focus().setTextAlign('left').run();
        onClose();
      },
      isActive: editor.isActive({ textAlign: 'left' }),
    },
    {
      icon: AlignCenter,
      label: 'Align Center',
      action: () => {
        editor.chain().focus().setTextAlign('center').run();
        onClose();
      },
      isActive: editor.isActive({ textAlign: 'center' }),
    },
    {
      icon: AlignRight,
      label: 'Align Right',
      action: () => {
        editor.chain().focus().setTextAlign('right').run();
        onClose();
      },
      isActive: editor.isActive({ textAlign: 'right' }),
    },
    {
      icon: AlignJustify,
      label: 'Justify',
      action: () => {
        editor.chain().focus().setTextAlign('justify').run();
        onClose();
      },
      isActive: editor.isActive({ textAlign: 'justify' }),
    },
    {
      icon: LinkIcon,
      label: 'Link',
      action: () => {
        onClose();
        onLinkClick();
      },
      isActive: editor.isActive('link'),
      divider: true
    },
    {
      icon: Eraser,
      label: 'Clear Formatting',
      action: () => {
        editor.chain().focus().unsetAllMarks().run();
        onClose();
      },
      isActive: false,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Font Size Picker */}
      <div ref={fontSizePickerRef} className="relative px-2 py-1">
        <button
          type="button"
          onClick={() => setShowFontSizePicker(!showFontSizePicker)}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Font Size"
        >
          <Type className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Text Size</span>
          <span className="text-xs text-gray-400">{getCurrentFontSize() || 'Default'}</span>
        </button>
        {showFontSizePicker && (
          <div className="absolute left-full top-0 ml-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[10000] p-2 max-h-48 overflow-y-auto">
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

      {/* Text Color Picker */}
      <div ref={colorPickerRef} className="relative px-2 py-1">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Text Color"
        >
          <Palette className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Text Color</span>
          <div 
            className="w-4 h-4 rounded border border-gray-300" 
            style={{ backgroundColor: getCurrentColor() }}
          />
        </button>
        {showColorPicker && (
          <div className="absolute left-full top-0 ml-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[10000] p-3 min-w-[200px]">
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
                              ? 'border-slate-700 ring-2 ring-slate-400' 
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

      <div className="border-t border-gray-200 my-1" />

      {/* Alignment and other options */}
      {menuItems.map((item, index) => (
        <div key={index}>
          {item.divider && index > 0 && (
            <div className="border-t border-gray-200 my-1" />
          )}
          <button
            type="button"
            onClick={item.action}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              item.isActive
                ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        </div>
      ))}
      
      {/* Keyboard shortcuts info */}
      <div className="border-t border-gray-200 mt-1 pt-1 px-4 py-2 text-xs text-gray-500">
        Shortcuts: ⌘B Bold, ⌘I Italic, ⌘U Underline
      </div>
    </div>
  );
};

export default EditorContextMenu;
