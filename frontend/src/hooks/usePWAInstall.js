import { useState, useEffect, useCallback } from 'react';

/**
 * usePWAInstall - Hook managing Progressive Web App installation lifecycle
 * Handles:
 * - Native beforeinstallprompt on Chromium (Android, Chrome, Edge)
 * - iOS Safari detection & instruction triggers
 * - Standalone display-mode detection (hides button if already installed)
 * - appinstalled event handling
 */
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Check standalone display mode on mount
  useEffect(() => {
    // 1. Detect if running as standalone PWA
    const checkIsStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                               window.navigator.standalone === true ||
                               document.referrer.includes('android-app://');
      return Boolean(isStandaloneMode);
    };

    if (checkIsStandalone()) {
      setIsInstalled(true);
    }

    // 2. Detect iOS (iPhone / iPad / iPod)
    const ua = window.navigator.userAgent || '';
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isAppleDevice);

    // If on iOS and not standalone, it is installable via Safari Share Menu
    if (isAppleDevice && !checkIsStandalone()) {
      setIsInstallable(true);
    }

    // 3. Listen for standalone display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    // 4. Capture native beforeinstallprompt event (Android, Desktop Chrome/Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 5. Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PixxTech PWA] Application successfully installed.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  // Trigger installation prompt
  const installApp = useCallback(async () => {
    // A. Native Chromium Prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return { status: 'accepted', platform: 'native' };
        } else {
          return { status: 'dismissed', platform: 'native' };
        }
      } catch (err) {
        console.warn('[PixxTech PWA] Native prompt error:', err);
        return { status: 'error', error: err.message, platform: 'native' };
      }
    }

    // B. iOS Safari Instructions
    if (isIOS) {
      return { status: 'instructions_needed', platform: 'ios' };
    }

    // C. Other/Fallback browser guidance
    return { status: 'instructions_needed', platform: 'browser' };
  }, [deferredPrompt, isIOS]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    hasNativePrompt: Boolean(deferredPrompt),
    installApp,
  };
};

export default usePWAInstall;
