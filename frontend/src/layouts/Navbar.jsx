import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  LogOut, 
  Shield, 
  ChevronDown,
  Sun,
  Moon,
  KeyRound,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Badge from '../components/Badge';
import logoImg from '../assets/logo.png';

/**
 * Enterprise Top Navigation Bar
 * Phase 4: Personalized greeting, dark/light mode toggle, role badge,
 * and comprehensive profile dropdown with safe logout.
 */
const Navbar = ({ onOpenMobileMenu, onSearch, searchQuery, onNavigate }) => {
  const { currentUser, logout, isRizwan } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    if (onNavigate) onNavigate('login');
  };

  const displayName = currentUser?.name || 'PixxTech Member';
  const displayRole = currentUser?.role || 'Viewer';
  const displayEmail = currentUser?.email || 'N/A';
  const avatarUrl = currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=35D6FF&color=070B17&bold=true`;

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-glass, rgba(7, 11, 23, 0.78))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Left: PixxTechnologies Portal Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
          onClick={() => onNavigate && onNavigate('software')}
          title="Return to Applications Launchpad"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '4px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), 0 0 10px rgba(255, 255, 255, 0.2)',
              flexShrink: 0,
            }}
          >
            <img
              src={logoImg}
              alt="PixxTech"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary, #F5F7FF)',
              }}
            >
              Pixx<span style={{ color: 'var(--cyan-accent, #35D6FF)' }}>Tech</span>
            </span>
            <Badge variant="cyan" size="sm">
              CENTRAL PORTAL
            </Badge>
          </div>
        </div>
      </div>

      {/* Right: Theme Toggle, Role Badge, Notifications & Profile Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--bg-glass, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #A5B1C8)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cyan-accent, #35D6FF)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary, #A5B1C8)')}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Role Badge */}
        <Badge variant={displayRole === 'Boss' ? 'violet' : 'cyan'} size="sm" dot>
          {displayRole}
        </Badge>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="Portal notifications"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: isNotificationsOpen ? 'rgba(53, 214, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isNotificationsOpen ? 'var(--cyan-accent, #35D6FF)' : 'var(--text-secondary, #A5B1C8)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--cyan-accent, #35D6FF)',
                boxShadow: '0 0 6px var(--cyan-accent, #35D6FF)',
              }}
            />
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div
              className="glass-surface"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '320px',
                backgroundColor: 'var(--bg-surface, #111B30)',
                borderRadius: '16px',
                border: '1px solid var(--border-card)',
                padding: '16px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Portal Alerts &amp; Events
                </span>
                <span style={{ fontSize: '11px', color: 'var(--cyan-accent)' }}>Live Monitor</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Active Central Session</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Logged in as {displayName} ({displayRole}).</div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Credential Isolation</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Independent logins for all 5 business applications are preserved.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px 4px 6px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <img
              src={avatarUrl}
              alt={displayName}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--cyan-accent, #35D6FF)',
              }}
            />
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }} className="user-text-pill">
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #F5F7FF)' }}>
                {displayName}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)' }}>
                {displayRole}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-muted, #64748B)" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="glass-surface"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '240px',
                backgroundColor: 'var(--bg-surface, #111B30)',
                borderRadius: '16px',
                border: '1px solid var(--border-card)',
                padding: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  {displayEmail}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {isRizwan && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onNavigate) onNavigate('settings');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <KeyRound size={15} color="var(--primary-accent)" />
                    <span>Settings &amp; Configuration</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#fb7185',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginTop: '4px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} />
                  <span>Sign Out of Portal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mobile-nav-toggle {
            display: flex !important;
          }
          .user-text-pill {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
