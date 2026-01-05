// Utility functions for theme-aware styling
export const getThemeClasses = (theme, lightClass, darkClass) => {
  return theme === 'dark' ? darkClass : lightClass
}

// Common text color classes
export const textColors = {
  primary: (theme) => theme === 'dark' ? 'text-slate-100' : 'text-slate-800',
  secondary: (theme) => theme === 'dark' ? 'text-slate-400' : 'text-slate-500',
  muted: (theme) => theme === 'dark' ? 'text-slate-500' : 'text-slate-400',
  accent: (theme, color = 'indigo') => theme === 'dark' 
    ? `text-${color}-400` 
    : `text-${color}-600`,
}

// Common background color classes
export const bgColors = {
  card: (theme) => theme === 'dark' 
    ? 'bg-[#0a0e17]/50' 
    : 'bg-white',
  surface: (theme) => theme === 'dark' 
    ? 'bg-[#0a0e17]/30' 
    : 'bg-slate-50',
  hover: (theme) => theme === 'dark' 
    ? 'hover:bg-[#0a0e17]/50' 
    : 'hover:bg-slate-50',
}

// Common border color classes
export const borderColors = {
  default: (theme) => theme === 'dark' 
    ? 'border-[#151a28]/50' 
    : 'border-slate-200',
  hover: (theme, color = 'indigo') => theme === 'dark' 
    ? `hover:border-${color}-700/50` 
    : `hover:border-${color}-200`,
}

