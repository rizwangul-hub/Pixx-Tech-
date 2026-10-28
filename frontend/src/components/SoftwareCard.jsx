import React, { useState, useRef, useCallback } from 'react';
import { 
  Receipt, 
  Building, 
  Calendar, 
  ShoppingCart, 
  CheckSquare, 
  ExternalLink, 
  ShieldCheck, 
  Copy, 
  Check, 
  Layers,
  ArrowUpRight,
  Info,
  AlertCircle,
  Database,
  Lock
} from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Modal from './Modal';
import portalApi from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import bicycleLogo from '../assets/website/bicycle.png';
import pakLogo from '../assets/website/pak.png';
import rotaLogo from '../assets/website/rota.png';
import taskLogo from '../assets/website/task.png';
import ukLogo from '../assets/website/uk.png';

// Direct Map of Website Logos from assets/website/
const WEBSITE_LOGOS = {
  'bicycle-purchase-system': bicycleLogo,
  'pakistan-expense-tracker': pakLogo,
  'rota-system': rotaLogo,
  'task-manager': taskLogo,
  'uk-company': ukLogo,
};

// Retrieve high-resolution website logo with automatic fallback
const getAppLogo = (app) => {
  if (app.logoUrl && !app.logoUrl.includes('placeholder')) {
    return app.logoUrl;
  }
  const slug = (app.slug || '').toLowerCase();
  if (WEBSITE_LOGOS[slug]) return WEBSITE_LOGOS[slug];

  const lower = (app.name || app.code || '').toLowerCase();
  if (lower.includes('bicycle')) return bicycleLogo;
  if (lower.includes('pakistan') || lower.includes('pak') || lower.includes('expense')) return pakLogo;
  if (lower.includes('rota')) return rotaLogo;
  if (lower.includes('task')) return taskLogo;
  if (lower.includes('uk') || lower.includes('company')) return ukLogo;

  return null;
};

// Central Directory of Specific Application Credentials
const APP_CREDENTIALS = {
  'bicycle-purchase-system': {
    kamran: { email: 'kamran@gmail.com', pass: 'kamran123', role: 'ADMIN' },
    fahad: { email: 'fahad@gmail.com', pass: 'fahad123', role: 'ADMIN' },
    khurshid: { email: 'khurshid@gmail.com', pass: 'khurshid123', role: 'ADMIN' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'ADMIN' },
  },
  'task-manager': {
    kamran: { email: 'kamran@gmail.com', pass: 'kamran123', role: 'Admin (Boss)' },
    fahad: { email: 'fahad@pixxtechnologiees.com', pass: 'fahad123', role: 'Admin' },
    khurshid: { email: 'khurshid@gmail.com', pass: 'khurshid123', role: 'Admin' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'Admin' },
  },
  'rota-system': {
    kamran: { username: 'kamran', pass: 'password123', role: 'Full Admin' },
    fahad: { username: 'fahad', pass: 'fahad123', role: 'Full Admin' },
    khurshid: { username: 'khurshid', pass: 'password123', role: 'Full Admin' },
    rizwan: { username: 'rizwan', email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'Full Admin' },
    sarfraz: { username: 'sarfraz', pass: 'password123', role: 'Attendance Checker' },
  },
  'uk-company': {
    kamran: { email: 'kamran@gmail.com', pass: 'kamran123', role: 'Full Admin (All Companies)' },
    fahad: { email: 'fahad@gmail.com', pass: 'fahad123', role: 'Full Admin (All Companies)' },
    khurshid: { email: 'khurshid@gmail.com', pass: 'khurshid123', role: 'Full Admin (All Companies)' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'Full Admin (All Companies)' },
  },
  'pakistan-expense-tracker': {
    kamran: { email: 'kamran@pixxtechnologies.com', pass: 'kamran123', role: 'ADMIN' },
    fahad: { email: 'fahad@pixxtechnologies.com', pass: 'fahad123', role: 'ADMIN' },
    khurshid: { email: 'khurshid@pixxtechnologies.com', pass: 'khurshid123', role: 'ADMIN' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'ADMIN' },
    sarfraz: { email: 'sarfraz@pixxtechnologies.com', pass: 'password123', role: 'DATA_ENTRY' },
  },
};

// Icon Map based on slug or category
const getIconForApp = (app) => {
  const identifier = (app.slug || app.code || app.name || '').toLowerCase();
  const category = (app.category || '').toLowerCase();

  if (identifier.includes('expense') || category.includes('finance')) return Receipt;
  if (identifier.includes('company') || identifier.includes('uk') || category.includes('corporate')) return Building;
  if (identifier.includes('rota') || identifier.includes('shift') || category.includes('workforce')) return Calendar;
  if (identifier.includes('bicycle') || identifier.includes('purchase') || category.includes('procurement')) return ShoppingCart;
  if (identifier.includes('task') || identifier.includes('sprint') || category.includes('project')) return CheckSquare;
  return Layers;
};

// Theme color based on category
const getThemeForCategory = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('finance')) return { theme: 'cyan', hex: '#35D6FF', bg: 'rgba(53, 214, 255, 0.12)' };
  if (cat.includes('corporate')) return { theme: 'violet', hex: '#9167FF', bg: 'rgba(145, 103, 255, 0.12)' };
  if (cat.includes('workforce')) return { theme: 'blue', hex: '#5B8CFF', bg: 'rgba(91, 140, 255, 0.12)' };
  if (cat.includes('procurement')) return { theme: 'emerald', hex: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  if (cat.includes('project')) return { theme: 'amber', hex: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
  return { theme: 'blue', hex: '#5B8CFF', bg: 'rgba(91, 140, 255, 0.12)' };
};

const LIVE_URLS = {
  'pakistan-expense-tracker': 'https://pixxtech-expense-tracker-fz2h.vercel.app',
  'uk-company': 'https://uk-companies.vercel.app',
  'rota-system': 'https://rota-system-eka1-eight.vercel.app',
  'bicycle-purchase-system': 'https://bicycle-uuue.vercel.app',
  'task-manager': 'https://task-manager-flame-five-73.vercel.app',
};

/**
 * Premium 3D Interactive Software Card
 * Features real pointer-based 3D tilt, specular lighting reflections,
 * safe external launch handling, and independent session preservation.
 */
const SoftwareCard = ({ software, app: legacyApp, index = 0, onSelectSoftware, onOpenApp }) => {
  const app = software || legacyApp || {};
  const toast = useToast();
  const { currentUser } = useAuth();
  const cardRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [launching, setLaunching] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Determine user's credentials for this specific app
  const getUserAppCredentials = () => {
    if (!currentUser) return null;
    const nameLower = (currentUser.name || '').toLowerCase();
    const emailLower = (currentUser.email || '').toLowerCase();
    const userLower = (currentUser.username || '').toLowerCase();

    let userKey = '';
    if (nameLower.includes('kamran') || emailLower.includes('kamran') || userLower.includes('kamran')) userKey = 'kamran';
    else if (nameLower.includes('fahad') || emailLower.includes('fahad') || userLower.includes('fahad')) userKey = 'fahad';
    else if (nameLower.includes('khurshid') || emailLower.includes('khurshid') || userLower.includes('khurshid')) userKey = 'khurshid';
    else if (nameLower.includes('rizwan') || emailLower.includes('rizwan') || userLower.includes('rizwan')) userKey = 'rizwan';
    else if (nameLower.includes('sarfraz') || emailLower.includes('sarfraz') || userLower.includes('sarfraz')) userKey = 'sarfraz';
    else if (nameLower.includes('admin') || emailLower.includes('admin') || userLower.includes('admin')) userKey = 'admin';

    // Also match app slug or name
    const slug = (app.slug || '').toLowerCase();
    let appKey = slug;
    if (!APP_CREDENTIALS[appKey]) {
      const lower = (app.name || app.code || '').toLowerCase();
      if (lower.includes('bicycle')) appKey = 'bicycle-purchase-system';
      else if (lower.includes('pakistan') || lower.includes('expense')) appKey = 'pakistan-expense-tracker';
      else if (lower.includes('rota')) appKey = 'rota-system';
      else if (lower.includes('task')) appKey = 'task-manager';
      else if (lower.includes('uk')) appKey = 'uk-company';
    }

    const appMap = APP_CREDENTIALS[appKey];
    if (appMap && userKey && appMap[userKey]) {
      return appMap[userKey];
    }

    return {
      email: currentUser.email || 'user@pixxtech.internal',
      pass: 'pixxtech123',
      role: currentUser.role || 'Member',
    };
  };

  const userAppCreds = getUserAppCredentials();
  const websiteLogo = getAppLogo(app);

  // 3D Pointer Tilt State
  const [transformStyle, setTransformStyle] = useState('');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const IconComponent = getIconForApp(app);
  const { theme, hex, bg } = getThemeForCategory(app.category);

  // Resolve target live URL with fallback to configured live Vercel deployments
  const getDestinationUrl = () => {
    if (app.url && !app.url.includes('.internal') && !app.url.startsWith('CONFIG_PLACEHOLDER')) {
      return app.url;
    }
    const slug = app.slug || '';
    if (slug && LIVE_URLS[slug]) {
      return LIVE_URLS[slug];
    }
    const lower = (app.name || app.code || '').toLowerCase();
    if (lower.includes('rota')) return LIVE_URLS['rota-system'];
    if (lower.includes('bicycle')) return LIVE_URLS['bicycle-purchase-system'];
    if (lower.includes('pakistan') || lower.includes('expense')) return LIVE_URLS['pakistan-expense-tracker'];
    if (lower.includes('uk')) return LIVE_URLS['uk-company'];
    if (lower.includes('task')) return LIVE_URLS['task-manager'];

    return app.url || app.targetUrlPlaceholder || '';
  };

  const targetUrl = getDestinationUrl();
  const isPlaceholderUrl = !targetUrl || targetUrl.includes('.internal') || targetUrl.startsWith('CONFIG_PLACEHOLDER');

  // Handle pointer move for 3D tilt and specular lighting
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg rotation
    const rotateY = ((x - centerX) / centerX) * 9;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`);
    setGlarePosition({
      x: ((x / rect.width) * 100).toFixed(1),
      y: ((y / rect.height) * 100).toFixed(1),
      opacity: 0.15,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)');
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  // In-App navigation on click: launches inside Central Portal AppViewer by default
  const handleLaunch = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onSelectSoftware) onSelectSoftware(app);

    const destUrl = getDestinationUrl();
    if (!destUrl || isPlaceholderUrl) {
      setIsModalOpen(true);
      return;
    }

    setLaunching(true);
    try {
      // Central Authorization enforcement & audit logging via backend API
      if (app._id || app.slug) {
        await portalApi.launchSoftware(app._id || app.slug);
      }

      // Open in responsive in-app viewer (unless fallback is requested)
      if (onOpenApp) {
        onOpenApp(app, destUrl);
      } else {
        toast.success(`Opening ${app.name}...`, 'In-App Gateway');
        window.open(destUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Access denied for this application.';
      toast.error(errorMsg, 'Access Denied');
    } finally {
      setLaunching(false);
    }
  };

  const handleSSOLaunch = async (e) => {
    e?.stopPropagation();
    if (onSelectSoftware) onSelectSoftware(app);
    setLaunching(true);
    try {
      const response = await portalApi.initiateSSO({ softwareId: app._id || app.slug });
      const { ticket, redirectUri } = response.data;
      toast.success(`SSO Ticket issued for ${app.name}. Handshake initiated.`, 'Single Sign-On');

      const launchUrl = redirectUri
        ? `${redirectUri}?ticket=${encodeURIComponent(ticket)}`
        : (targetUrl ? `${targetUrl}?sso_ticket=${encodeURIComponent(ticket)}` : null);

      if (launchUrl && !isPlaceholderUrl) {
        if (onOpenApp) {
          onOpenApp({ ...app, url: launchUrl }, launchUrl);
        } else {
          window.open(launchUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        toast.info(`SSO authorization generated. Ticket ID: ${response.data.ticketId}`);
      }
    } catch (err) {
      toast.error(err.message || 'SSO authentication denied', 'Access Denied');
    } finally {
      setLaunching(false);
    }
  };

  const handleCopyPlaceholder = () => {
    navigator.clipboard?.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
    toast.info('Application URL placeholder copied to clipboard.');
  };

  return (
    <>
      <div
        className="perspective-container"
        style={{
          height: '100%',
          display: 'flex',
        }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleLaunch}
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 22px',
            backgroundColor: 'var(--bg-glass, rgba(17, 27, 48, 0.78))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: '1px solid var(--border-card, rgba(91, 140, 255, 0.18))',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease-out, border-color 0.25s ease, box-shadow 0.25s ease',
            transform: transformStyle,
            transformStyle: 'preserve-3d',
            overflow: 'hidden',
          }}
        >
          {/* Dynamic Specular Glare following pointer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              borderRadius: '20px',
              background: `radial-gradient(circle 240px at ${glarePosition.x}% ${glarePosition.y}%, rgba(53, 214, 255, ${glarePosition.opacity}), transparent 75%)`,
              transition: 'opacity 0.2s ease',
            }}
          />

          {/* Top Row: App Icon / Logo + Category Badge */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              {websiteLogo && !imgFailed ? (
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid rgba(255, 255, 255, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '6px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28), 0 0 12px rgba(255, 255, 255, 0.2)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={websiteLogo}
                    alt={app.name}
                    onError={() => setImgFailed(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      display: 'block',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${bg} 0%, rgba(17, 27, 48, 0.9) 100%)`,
                    border: `1.5px solid ${hex}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: hex,
                    boxShadow: `0 6px 16px ${hex}25`,
                    flexShrink: 0,
                  }}
                >
                  <IconComponent size={24} />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant={theme} size="sm">
                  {app.category || 'Enterprise'}
                </Badge>
                {app.ssoEnabled && (
                  <Badge variant="cyan" size="sm">
                    SSO Ready
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  title="View technical details"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #64748B)',
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                  }}
                >
                  <Info size={15} />
                </button>
              </div>
            </div>

            {/* Application Name & Short Description */}
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary, #F5F7FF)',
                marginBottom: '8px',
                letterSpacing: '-0.015em',
                lineHeight: 1.3,
              }}
            >
              {app.name}
            </h3>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary, #A5B1C8)',
                lineHeight: 1.55,
                margin: '0 0 14px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {app.description || 'Enterprise software managed under the PixxTechnologies central gateway.'}
            </p>

            {/* Direct Login Credentials on Card with 1-Click Copy */}
            {userAppCreds && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#7DD3FC',
                  border: '1px solid #38BDF8',
                  boxShadow: '0 6px 18px rgba(56, 189, 248, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#075985', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Website Login Credentials
                  </span>
                  {userAppCreds.role && (
                    <span style={{ fontSize: '10px', color: '#0C4A6E', fontWeight: 700 }}>
                      {userAppCreds.role}
                    </span>
                  )}
                </div>

                {/* Email / Username Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(240, 249, 255, 0.92)',
                    border: '1px solid rgba(12, 74, 110, 0.18)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, marginRight: '8px' }}>
                    <span style={{ fontSize: '9.5px', color: '#075985', fontWeight: 600 }}>
                      {userAppCreds.username ? 'Username / ID' : 'Email'}
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: '#082F49',
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {userAppCreds.username || userAppCreds.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = userAppCreds.username || userAppCreds.email;
                      navigator.clipboard?.writeText(text);
                      setCopiedField(`email-${app._id || app.slug}`);
                      toast.success(`Copied: ${text}`, 'Copied to Clipboard');
                      setTimeout(() => setCopiedField(''), 2000);
                    }}
                    title="Copy Email / ID"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: copiedField === `email-${app._id || app.slug}` ? 'rgba(16, 185, 129, 0.25)' : '#BAE6FD',
                      border: `1px solid ${copiedField === `email-${app._id || app.slug}` ? '#10B981' : '#38BDF8'}`,
                      color: copiedField === `email-${app._id || app.slug}` ? '#065F46' : '#075985',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copiedField === `email-${app._id || app.slug}` ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedField === `email-${app._id || app.slug}` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Password Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(240, 249, 255, 0.92)',
                    border: '1px solid rgba(12, 74, 110, 0.18)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, marginRight: '8px' }}>
                    <span style={{ fontSize: '9.5px', color: '#075985', fontWeight: 600 }}>
                      Password
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: '#082F49',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {userAppCreds.pass}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard?.writeText(userAppCreds.pass);
                      setCopiedField(`pass-${app._id || app.slug}`);
                      toast.success('Password copied to clipboard', 'Copied to Clipboard');
                      setTimeout(() => setCopiedField(''), 2000);
                    }}
                    title="Copy Password"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: copiedField === `pass-${app._id || app.slug}` ? 'rgba(16, 185, 129, 0.25)' : '#BAE6FD',
                      border: `1px solid ${copiedField === `pass-${app._id || app.slug}` ? '#10B981' : '#38BDF8'}`,
                      color: copiedField === `pass-${app._id || app.slug}` ? '#065F46' : '#075985',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copiedField === `pass-${app._id || app.slug}` ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedField === `pass-${app._id || app.slug}` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row: Status Badge & Open Action Button */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              paddingTop: '14px',
              borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: app.isActive !== false ? '#10B981' : '#F43F5E',
                  boxShadow: `0 0 8px ${app.isActive !== false ? '#10B981' : '#F43F5E'}`,
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>
                {isPlaceholderUrl ? 'Setup Pending' : 'Live Gateway'}
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={ArrowUpRight}
              iconPosition="right"
              onClick={handleLaunch}
              loading={launching}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '8px',
              }}
            >
              Open Application
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Application Launch & Setup Inspector */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={app.name}
        subtitle={`${app.category || 'Business'} • Managed System Gateway`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-surface-elevated, #162442)',
              border: `1px solid ${hex}30`,
            }}
          >
            {websiteLogo && !imgFailed ? (
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '5px',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22), 0 0 10px rgba(255, 255, 255, 0.2)',
                }}
              >
                <img
                  src={websiteLogo}
                  alt={app.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: hex,
                  flexShrink: 0,
                }}
              >
                <IconComponent size={24} />
              </div>
            )}
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #F5F7FF)' }}>
                {app.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #A5B1C8)' }}>
                System Slug: <code style={{ color: hex }}>{app.slug}</code>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', marginBottom: '6px' }}>
              System Overview
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #A5B1C8)', lineHeight: 1.6, margin: 0 }}>
              {app.description || 'Full operational suite for PixxTechnologies personnel.'}
            </p>
          </div>

          {/* Endpoint Status Box */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Target Endpoint URL
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-base, #0B1021)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                fontSize: '12.5px',
                color: isPlaceholderUrl ? '#F59E0B' : '#35D6FF',
                fontFamily: 'var(--font-mono)',
                wordBreak: 'break-all',
                gap: '10px',
              }}
            >
              <span>{targetUrl}</span>
              <button
                type="button"
                onClick={handleCopyPlaceholder}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#10B981' : 'var(--text-muted, #64748B)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
                title="Copy URL"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Specific Authorized Credentials Helper */}
          {userAppCreds && (
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: 'rgba(53, 214, 255, 0.05)',
                border: '1px solid rgba(53, 214, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#35D6FF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your Credentials for this system
                </span>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                  Role: {userAppCreds.role}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {/* Username / Email Field */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-base, #0B1021)',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', marginBottom: '3px' }}>
                    {userAppCreds.username ? 'Username' : 'Email Address'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <code style={{ fontSize: '12px', color: '#F5F7FF' }}>
                      {userAppCreds.username || userAppCreds.email}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(userAppCreds.username || userAppCreds.email);
                        setCopiedField('id');
                        setTimeout(() => setCopiedField(''), 2000);
                        toast.success('Copied login identifier to clipboard');
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === 'id' ? '#10B981' : '#64748B' }}
                      title="Copy"
                    >
                      {copiedField === 'id' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Password Field */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-base, #0B1021)',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748B)', marginBottom: '3px' }}>
                    Password
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <code style={{ fontSize: '12px', color: '#F5F7FF' }}>
                      {userAppCreds.pass}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(userAppCreds.pass);
                        setCopiedField('pass');
                        setTimeout(() => setCopiedField(''), 2000);
                        toast.success('Copied password to clipboard');
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === 'pass' ? '#10B981' : '#64748B' }}
                      title="Copy"
                    >
                      {copiedField === 'pass' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup / Informative Notice */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: isPlaceholderUrl ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${isPlaceholderUrl ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
              fontSize: '12.5px',
              color: 'var(--text-secondary, #A5B1C8)',
              lineHeight: 1.55,
            }}
          >
            {isPlaceholderUrl ? (
              <>
                <strong style={{ color: '#F59E0B' }}>Awaiting Production URL:</strong> In accordance with project requirements, live production URLs are not assumed. Once you provide the real deployed domain, configure it in the MongoDB software registry.
              </>
            ) : (
              <>
                <strong style={{ color: '#10B981' }}>Live Endpoint Configured:</strong> Clicking launch opens the system in a secure new browser tab.
              </>
            )}
          </div>

          {/* Independent Credentials Guarantee */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: '#10B981',
              paddingTop: '6px',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>Independent application logins, passwords, and sessions remain strictly separate.</span>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            {app.ssoEnabled ? (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowUpRight}
                iconPosition="right"
                onClick={handleSSOLaunch}
                loading={launching}
              >
                Launch with SSO
              </Button>
            ) : (
              !isPlaceholderUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowUpRight}
                  iconPosition="right"
                  onClick={handleLaunch}
                  loading={launching}
                >
                  Launch in New Tab
                </Button>
              )
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SoftwareCard;
