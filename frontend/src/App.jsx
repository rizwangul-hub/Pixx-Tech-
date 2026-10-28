import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from './layouts/MainLayout';
import Software from './pages/Software';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import LoadingScreen from './components/LoadingScreen';
import portalApi from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import laptopImg from './assets/laptop.png';
import mobileImg from './assets/mobile.png';

/**
 * Inner Application Router & Page Controller
 * Handles the initial startup lifecycle, authentication, backend health,
 * and responsive PixxTechnologies Loading Screen (Laptop vs Mobile).
 */
function AppContent() {
  const { loading: authLoading, isAuthenticated, refreshProfile, isRizwan } = useAuth();
  const [currentPage, setCurrentPage] = useState('software');
  const [activeViewingApp, setActiveViewingApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);

  // Startup lifecycle state
  const [isInitialBoot, setIsInitialBoot] = useState(true);
  const [startupTimedOut, setStartupTimedOut] = useState(false);
  const [startupError, setStartupError] = useState(null);
  const hasFinishedInitialAuth = useRef(false);

  // Probe backend health status
  const checkBackendHealth = useCallback(async () => {
    try {
      const data = await portalApi.getHealth();
      if (data && (data.status === 'operational' || data.status === 'degraded')) {
        setIsBackendOnline(true);
        setBackendHealth(data);
        return true;
      }
      setIsBackendOnline(false);
      setBackendHealth(null);
      return false;
    } catch {
      setIsBackendOnline(false);
      setBackendHealth(null);
      return false;
    }
  }, []);

  // Periodic health checks (every 20 seconds)
  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 20000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  // Essential startup initialization: Preload responsive assets, enforce safety timeout
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never trap user in infinite loading if network hangs (> 7.5s)
    const timeoutId = setTimeout(() => {
      if (isMounted && isInitialBoot) {
        setStartupTimedOut(true);
      }
    }, 7500);

    // Preload both laptop and mobile loading images to guarantee instant rendering
    try {
      const imgLaptop = new Image();
      imgLaptop.src = laptopImg;

      const imgMobile = new Image();
      imgMobile.src = mobileImg;
    } catch (err) {
      console.warn('[PixxTech] Asset preload notice:', err?.message);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isInitialBoot]);

  // Resolve initial boot once authentication verification completes
  useEffect(() => {
    if (!authLoading && !hasFinishedInitialAuth.current) {
      hasFinishedInitialAuth.current = true;
      // Gentle settle delay (450ms) ensures smooth visual transition and prevents UI flashes
      const settleTimer = setTimeout(() => {
        setIsInitialBoot(false);
      }, 450);
      return () => clearTimeout(settleTimer);
    }
  }, [authLoading]);

  // Retry startup checks if delayed or requested by user
  const handleRetryStartup = useCallback(() => {
    setStartupTimedOut(false);
    setStartupError(null);
    checkBackendHealth();
    if (typeof refreshProfile === 'function') {
      refreshProfile();
    }
  }, [checkBackendHealth, refreshProfile]);

  // Allow manual bypass if backend connection is slow/unresponsive
  const handleBypassStartup = useCallback(() => {
    setIsInitialBoot(false);
  }, []);

  return (
    <>
      {/* Responsive PixxTechnologies Startup Loading Screen */}
      <AnimatePresence mode="wait">
        {isInitialBoot && (
          <LoadingScreen
            key="pixxtech-responsive-loading-screen"
            isTimedOut={startupTimedOut}
            error={startupError}
            onRetry={handleRetryStartup}
            onBypass={handleBypassStartup}
          />
        )}
      </AnimatePresence>

      {/* Main Application Interface */}
      {!isInitialBoot && (
        <motion.div
          key="pixxtech-app-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          style={{ minHeight: '100vh', width: '100%' }}
        >
          {/* Unauthenticated or Explicit Login View */}
          {!isAuthenticated || currentPage === 'login' ? (
            <Login onLoginSuccess={() => setCurrentPage('software')} />
          ) : (
            /* Protected Central Application Layout */
            <MainLayout
              currentPage={currentPage}
              onNavigate={setCurrentPage}
              isBackendOnline={isBackendOnline}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              isViewingApp={Boolean(activeViewingApp)}
            >
              {currentPage === 'software' && (
                <Software
                  onNavigate={setCurrentPage}
                  activeViewingApp={activeViewingApp}
                  onViewingAppChange={setActiveViewingApp}
                />
              )}
              {isRizwan && currentPage === 'users' && <Users onNavigate={setCurrentPage} />}
              {isRizwan && currentPage === 'settings' && (
                <Settings
                  isBackendOnline={isBackendOnline}
                  backendHealth={backendHealth}
                  onRefreshHealth={checkBackendHealth}
                />
              )}
              {/* Fallback to software view if unauthorized route requested */}
              {(!isRizwan && currentPage !== 'software') && (
                <Software
                  onNavigate={setCurrentPage}
                  activeViewingApp={activeViewingApp}
                  onViewingAppChange={setActiveViewingApp}
                />
              )}
            </MainLayout>
          )}
        </motion.div>
      )}
    </>
  );
}

/**
 * Root App Component wrapped with Auth, Theme & Toast Providers
 */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
