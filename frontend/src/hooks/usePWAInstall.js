import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing PWA install prompt and device detection.
 * 
 * Handles:
 * - Capturing the `beforeinstallprompt` event
 * - Detecting if the app is already installed (standalone mode)
 * - Detecting device type (mobile/tablet/desktop)
 * - iOS Safari special handling (no beforeinstallprompt support)
 * - Dismiss cooldown (7-day localStorage persistence)
 */

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_COOLDOWN_DAYS = 7;

/**
 * Check if the dismiss cooldown is still active
 */
function isDismissCooldownActive() {
    try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (!dismissed) return false;
        const dismissedAt = parseInt(dismissed, 10);
        const cooldownMs = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        return Date.now() - dismissedAt < cooldownMs;
    } catch {
        return false;
    }
}

/**
 * Detect if the device is iOS
 */
function getIsIOS() {
    if (typeof navigator === 'undefined') return false;
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
}

/**
 * Detect if running in standalone mode (already installed)
 */
function getIsStandalone() {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true // iOS Safari
    );
}

/**
 * Detect device type based on viewport width
 */
function getDeviceType() {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(getIsStandalone);
    const [isDismissed, setIsDismissed] = useState(isDismissCooldownActive);
    const [deviceType, setDeviceType] = useState(getDeviceType);
    const isIOS = getIsIOS();

    // Capture the beforeinstallprompt event
    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Detect when the app gets installed
        const installedHandler = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    // Track viewport resizes for device type detection
    useEffect(() => {
        const handleResize = () => {
            setDeviceType(getDeviceType());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Listen for display-mode changes (installed via browser UI)
    useEffect(() => {
        const mql = window.matchMedia('(display-mode: standalone)');
        const handler = (e) => {
            setIsInstalled(e.matches);
        };
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    /**
     * Trigger the native install prompt
     */
    const promptInstall = useCallback(async () => {
        if (!deferredPrompt) return false;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }

            setDeferredPrompt(null);
            return outcome === 'accepted';
        } catch (error) {
            console.error('[PWA] Install prompt error:', error);
            return false;
        }
    }, [deferredPrompt]);

    /**
     * Dismiss the install banner with cooldown
     */
    const dismissInstall = useCallback(() => {
        try {
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        } catch {
            // localStorage might be unavailable
        }
        setIsDismissed(true);
    }, []);

    /**
     * Whether the install button should be shown
     * - Not already installed
     * - Not dismissed (or cooldown expired)
     * - Either has a deferred prompt (Chrome/Edge) OR is iOS (show manual instructions)
     */
    const isInstallable = !isInstalled && !isDismissed && (!!deferredPrompt || isIOS);

    return {
        isInstallable,
        isInstalled,
        isIOS,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        deviceType,
        promptInstall,
        dismissInstall,
        hasDeferredPrompt: !!deferredPrompt,
    };
}
