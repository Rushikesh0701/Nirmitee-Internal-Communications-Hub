import { useState, useRef, useEffect, memo } from 'react';

/**
 * Color Picker Component
 * A reusable color picker with hex input and visual preview
 */
const ColorPicker = ({ 
  value = '#000000', 
  onChange, 
  label,
  description,
  disabled = false 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const colorInputRef = useRef(null);
  const throttleTimer = useRef(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setLocalValue(newColor);
    
    // Throttle the parent update to 50ms to keep UI stable during fast drags
    if (!throttleTimer.current) {
      onChange?.(newColor);
      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null;
      }, 50);
    }
  };

  const handleHexInputChange = (e) => {
    let hex = e.target.value;
    // Add # if not present
    if (hex && !hex.startsWith('#')) {
      hex = '#' + hex;
    }
    setLocalValue(hex);
    // Only call onChange if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange?.(hex);
    }
  };

  const handleHexInputBlur = () => {
    // Validate and fix hex on blur
    if (!/^#[0-9A-Fa-f]{6}$/.test(localValue)) {
      setLocalValue(value); // Reset to original value if invalid
    }
  };

  const openColorPicker = () => {
    if (!disabled && colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  return (
    <div 
      className="flex flex-col gap-1"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {label && (
        <label className="text-overline text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        {/* Color preview circle */}
        <button
          type="button"
          onClick={openColorPicker}
          disabled={disabled}
          className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-600 cursor-pointer hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: localValue }}
          title="Click to pick color"
        />
        
        {/* Hidden native color input */}
        <input
          ref={colorInputRef}
          type="color"
          value={localValue}
          onChange={handleColorChange}
          disabled={disabled}
          className="sr-only"
        />
        
        {/* Hex input */}
        <input
          type="text"
          value={localValue}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          disabled={disabled}
          maxLength={7}
          className="input w-28 text-caption py-2 font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="#000000"
        />
      </div>
      {description && (
        <p className="text-overline text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
};

export default memo(ColorPicker);
