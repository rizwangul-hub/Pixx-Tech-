import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2
} from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  getAppLogo, 
  getDestinationUrl, 
  getUserAppCredentials 
} from '../utils/appCredentials';
import logoImg from '../assets/logo.png';

/**
 * AppViewer - Responsive In-App Embedded Application Viewer
 * 
 * Objectives:
 * - Desktop/Laptop: In-App Embedded Viewer within Central Portal with top navbar,
 *   reload control, credentials copy widget, and Back to Dashboard button.
 * - Mobile / Installed PWA: Full-screen in-app rendering with persistent back navigation,
 *   touch optimization, and safe-area compatibility.
 * - Central Authorization: Re-validates session, preserves RBAC, and prevents arbitrary URLs.
 */
const AppViewer = ({ app, onBack }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const iframeRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedField, setCopiedField] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);

  const websiteLogo = getAppLogo(app);
  const destinationUrl = getDestinationUrl(app);
  const userCreds = getUserAppCredentials(currentUser, app);

  // Listen for return messages from child website iframes
  useEffect(() => {
    const handleCrossWindowMessage = (event) => {
      if (
        event.data === 'PIXXTECH_RETURN' ||
        event.data === 'BACK_TO_PORTAL' ||
        event.data?.type === 'PIXXTECH_RETURN' ||
        event.data?.action === 'BACK_TO_PORTAL'
      ) {
        if (onBack) onBack();
      }
    };

    window.addEventListener('message', handleCrossWindowMessage);
    return () => window.removeEventListener('message', handleCrossWindowMessage);
  }, [onBack]);

  // Handle browser back button (popstate) to return safely to Central Portal
  useEffect(() => {
    const handlePopState = () => {
      if (onBack) onBack();
    };

    window.history.pushState({ appViewer: app.slug || app.name }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [app, onBack]);

  // Reload iframe
  const handleReload = () => {
    setIsLoading(true);
    setHasLoadError(false);
    setIframeKey((prev) => prev + 1);
    toast.info(`Reloading ${app.name}...`, 'In-App Viewer');
  };

  // Safe external window fallback
  const handleOpenExternal = () => {
    if (destinationUrl) {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      toast.info(`Opened ${app.name} in external tab.`, 'Direct Navigation');
    }
  };

  // Copy helper
  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`Copied ${label}: ${text}`, 'Clipboard');
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#070B17',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
      }}
      className="pixxtech-inapp-viewer"
    >
      {/* Floating Pill when header is minimized for 100% full screen */}
      {isHeaderMinimized && (
        <div
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={onBack}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(7, 11, 23, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              color: '#F5F7FF',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              borderRadius: '24px',
            }}
            title="Return to Central Portal Dashboard"
          >
            <span className="back-btn-text">Back to Dashboard</span>
          </Button>

          <button
            type="button"
            onClick={() => setIsHeaderMinimized(false)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(7, 11, 23, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
            title="Expand Full Header Bar"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      )}

      {/* 1. Persistent Top Navigation Bar */}
      {!isHeaderMinimized && (
        <header
          style={{
            height: '42px',
            minHeight: '42px',
            backgroundColor: 'rgba(7, 11, 23, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            gap: '10px',
            position: 'relative',
            zIndex: 10,
          }}
        >
        {/* Left: Back Button & Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={onBack}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#F5F7FF',
              flexShrink: 0,
            }}
            title="Return to Central Portal Dashboard"
          >
            <span className="back-btn-text">Back to Dashboard</span>
          </Button>

          <div
            style={{
              height: '24px',
              width: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              flexShrink: 0,
            }}
          />

          {/* PixxTech Portal Logo Badge */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '2px',
              flexShrink: 0,
            }}
            title="PixxTech Central Portal"
          >
            <img
              src={logoImg}
              alt="PixxTech"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* App Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {websiteLogo && (
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '2px',
                  flexShrink: 0,
                }}
              >
                <img
                  src={websiteLogo}
                  alt={app.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#F5F7FF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}
              >
                {app.name}
              </span>
              <span
                className="desktop-only-badge"
                style={{
                  fontSize: '10px',
                  color: '#35D6FF',
                  fontWeight: 600,
                }}
              >
                In-App Connected Gateway
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Credentials Quick-Copy Widget */}
        {userCreds && (
          <div
            className="desktop-credentials-bar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Login:</span>
            
            {/* Email / Username pill */}
            <button
              type="button"
              onClick={() => handleCopy(userCreds.username || userCreds.email, 'email', 'Username/Email')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: copiedField === 'email' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${copiedField === 'email' ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                color: copiedField === 'email' ? '#10B981' : '#F5F7FF',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer',
              }}
              title="Click to copy email/username"
            >
              <span>{userCreds.username || userCreds.email}</span>
              {copiedField === 'email' ? <Check size={11} /> : <Copy size={11} />}
            </button>

            {/* Password pill */}
            <button
              type="button"
              onClick={() => handleCopy(userCreds.pass, 'pass', 'Password')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: copiedField === 'pass' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${copiedField === 'pass' ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                color: copiedField === 'pass' ? '#10B981' : '#F5F7FF',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer',
              }}
              title="Click to copy password"
            >
              <span>{userCreds.pass}</span>
              {copiedField === 'pass' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
        )}

        {/* Right Controls: Mobile Credentials Toggle, Reload & External Fallback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Mobile Credentials Drawer Toggle Button */}
          {userCreds && (
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="mobile-credentials-toggle"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                borderRadius: '8px',
                backgroundColor: isMobileDrawerOpen ? 'rgba(53, 214, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(53, 214, 255, 0.3)',
                color: '#35D6FF',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Key</span>
              {isMobileDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {/* Reload Iframe Button */}
          <button
            type="button"
            onClick={handleReload}
            style={{
              padding: '7px 9px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#A5B1C8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Reload application window"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Explicit External Tab Fallback */}
          <Button
            variant="ghost"
            size="sm"
            icon={ExternalLink}
            onClick={handleOpenExternal}
            style={{
              padding: '6px 10px',
              fontSize: '11.5px',
              color: '#A5B1C8',
            }}
            title="Open in separate browser window"
          >
            <span className="external-btn-text">Open External</span>
          </Button>

          {/* Minimize Header Toggle for 100% Full Screen */}
          <button
            type="button"
            onClick={() => setIsHeaderMinimized(true)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#A5B1C8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Minimize header to view full website"
          >
            <Minimize2 size={13} />
          </button>
        </div>
      </header>
      )}

      {/* Mobile Credentials Dropdown Banner */}
      {isMobileDrawerOpen && userCreds && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#0D1527',
            borderBottom: '1px solid rgba(53, 214, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            zIndex: 9,
          }}
          className="mobile-credentials-drawer"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>User:</span>
            <span style={{ fontSize: '12px', color: '#F5F7FF', fontFamily: 'var(--font-mono)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userCreds.username || userCreds.email}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => handleCopy(userCreds.username || userCreds.email, 'mob-user', 'Username/Email')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: copiedField === 'mob-user' ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {copiedField === 'mob-user' ? 'Copied' : 'Copy Email'}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(userCreds.pass, 'mob-pass', 'Password')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: copiedField === 'mob-pass' ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {copiedField === 'mob-pass' ? 'Copied' : 'Copy Pass'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Embedded Iframe Viewport Container */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          height: isHeaderMinimized ? '100%' : 'calc(100% - 42px)',
          overflow: 'hidden',
          backgroundColor: '#030712',
        }}
      >
        {/* Animated Loading Overlay */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#070B17',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '3px solid rgba(53, 214, 255, 0.18)',
                borderTopColor: '#35D6FF',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#F5F7FF' }}>
                Connecting to {app.name}...
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                Secured inside PixxTechnologies Central Gateway
              </div>
            </div>
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={destinationUrl}
          title={app.name}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasLoadError(true);
          }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
          allow="clipboard-read; clipboard-write; fullscreen"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            backgroundColor: '#FFFFFF',
          }}
        />

        {/* Fallback Notice if third-party application blocks embedding */}
        {hasLoadError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#070B17',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 3,
            }}
          >
            <div
              style={{
                maxWidth: '460px',
                textAlign: 'center',
                padding: '28px',
                borderRadius: '16px',
                backgroundColor: 'rgba(17, 27, 48, 0.85)',
                border: '1px solid rgba(91, 140, 255, 0.25)',
              }}
            >
              <AlertTriangle size={36} color="#F59E0B" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F5F7FF', marginBottom: '8px' }}>
                Direct Window Fallback Required
              </h3>
              <p style={{ fontSize: '13px', color: '#A5B1C8', lineHeight: 1.55, marginBottom: '20px' }}>
                {app.name} enforces browser-level cross-origin restrictions (X-Frame-Options or third-party cookies). Click below to launch safely in a dedicated window.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Button variant="ghost" size="sm" onClick={onBack}>
                  Return to Dashboard
                </Button>
                <Button variant="primary" size="sm" icon={ExternalLink} onClick={handleOpenExternal}>
                  Open in Dedicated Window
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .back-btn-text {
            display: none;
          }
          .desktop-credentials-bar {
            display: none !important;
          }
          .desktop-only-badge {
            display: none !important;
          }
          .mobile-credentials-toggle {
            display: flex !important;
          }
          .external-btn-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AppViewer;
