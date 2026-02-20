import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * PWA Install Button — Device-aware install prompt.
 * 
 * Variants:
 * - "navbar" : Compact button for the desktop top bar
 * - "footer" : Prominent fixed-bottom banner for mobile/tablet
 * 
 * @param {Object} props
 * @param {'navbar'|'footer'} props.variant - Display variant
 */
const PWAInstallButton = ({ variant = 'navbar' }) => {
  const {
    isInstallable,
    isIOS,
    promptInstall,
    dismissInstall,
    hasDeferredPrompt,
  } = usePWAInstall();

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Don't render if not installable
  if (!isInstallable) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (hasDeferredPrompt) {
      await promptInstall();
    }
  };

  // ==========================================
  // NAVBAR VARIANT (Desktop)
  // ==========================================
  if (variant === 'navbar') {
    return (
      <>
        <motion.button
          onClick={handleInstallClick}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200 hover:scale-105 active:scale-95
            ${isDark
              ? 'bg-[#ff4701]/10 text-[#ff4701] hover:bg-[#ff4701]/20 border border-[#ff4701]/20'
              : 'bg-[#ff4701] text-white hover:bg-[#ff4701]/90 shadow-sm'
            }
          `}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          title="Install Nirmitee Hub as an app"
          id="pwa-install-navbar"
        >
          <Download size={16} className="flex-shrink-0" />
          <span className="hidden xl:inline whitespace-nowrap">Install App</span>
        </motion.button>

        {/* iOS Instructions Modal */}
        <IOSInstructionModal
          isOpen={showIOSModal}
          onClose={() => setShowIOSModal(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // ==========================================
  // FOOTER VARIANT (Mobile / Tablet)
  // ==========================================
  if (variant === 'footer') {
    return (
      <>
        <AnimatePresence>
          <motion.div
            className={`
              fixed bottom-0 left-0 right-0 z-[60] p-3 border-t backdrop-blur-xl
              ${isDark
                ? 'bg-[#0a0e17]/95 border-[#151a28]'
                : 'bg-white/95 border-slate-200'
              }
            `}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            id="pwa-install-footer"
          >
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              {/* App Icon */}
              <div className={`
                flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                ${isDark ? 'bg-[#151a28]' : 'bg-slate-100'}
              `}>
                <Smartphone
                  size={22}
                  className={isDark ? 'text-[#ff4701]' : 'text-[#0F1E56]'}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Install Nirmitee Hub
                </p>
                <p className={`text-xs leading-tight mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Add to home screen for quick access
                </p>
              </div>

              {/* Install Button */}
              <motion.button
                onClick={handleInstallClick}
                className="
                  flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg
                  bg-[#ff4701] text-white text-sm font-semibold
                  hover:bg-[#e83f01] active:bg-[#d63a01]
                  transition-colors duration-200
                "
                whileTap={{ scale: 0.95 }}
                id="pwa-install-footer-btn"
              >
                <Download size={14} />
                Install
              </motion.button>

              {/* Dismiss Button */}
              <motion.button
                onClick={dismissInstall}
                className={`
                  flex-shrink-0 p-1.5 rounded-lg transition-colors duration-200
                  ${isDark
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-[#151a28]'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }
                `}
                whileTap={{ scale: 0.9 }}
                title="Dismiss"
                id="pwa-install-footer-dismiss"
              >
                <X size={16} />
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* iOS Instructions Modal */}
        <IOSInstructionModal
          isOpen={showIOSModal}
          onClose={() => setShowIOSModal(false)}
          isDark={isDark}
        />
      </>
    );
  }

  return null;
};

// ==========================================
// iOS "Add to Home Screen" Instructions Modal
// ==========================================
const IOSInstructionModal = ({ isOpen, onClose, isDark }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: <Share size={18} className="text-[#007AFF]" />,
      text: 'Tap the Share button in Safari\'s toolbar',
    },
    {
      icon: <Plus size={18} className="text-[#007AFF]" />,
      text: 'Scroll down and tap "Add to Home Screen"',
    },
    {
      icon: <Download size={18} className="text-[#007AFF]" />,
      text: 'Tap "Add" to install the app',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className={`
            relative w-full max-w-sm rounded-2xl p-5 z-10
            ${isDark
              ? 'bg-[#0a0e17] border border-[#151a28]'
              : 'bg-white border border-slate-200'
            }
          `}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`
              absolute top-3 right-3 p-1.5 rounded-lg transition-colors
              ${isDark
                ? 'text-slate-500 hover:text-slate-300 hover:bg-[#151a28]'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${isDark ? 'bg-[#151a28]' : 'bg-slate-100'}
            `}>
              <Smartphone size={24} className="text-[#ff4701]" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Install Nirmitee Hub
              </h3>
              <p className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Add to your home screen
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-5">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5
                  ${isDark ? 'bg-[#151a28]' : 'bg-slate-100'}
                `}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Step {index + 1}
                  </span>
                  <p className={`text-sm leading-tight ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Done button */}
          <button
            onClick={onClose}
            className="
              w-full py-2.5 rounded-xl text-sm font-semibold
              bg-[#ff4701] text-white hover:bg-[#e83f01]
              transition-colors duration-200
            "
          >
            Got it!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default memo(PWAInstallButton);
