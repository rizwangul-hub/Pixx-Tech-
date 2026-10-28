import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  Activity, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

/**
 * Enterprise Collapsible Sidebar Navigation
 * Phase 4: Dynamic RBAC menu filtering, collapse/expand toggle,
 * tooltips, and responsive mobile drawer.
 */
const Sidebar = ({ currentPage, onNavigate, isBackendOnline, isOpen, onClose }) => {
  const { isRizwan } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic Navigation Items:
  // For Rizwan only: Applications, User Governance, and Settings.
  // For all other users: Applications only (Dashboard, Profile, Activity Logs, and Settings are completely removed).
  const navItems = isRizwan
    ? [
        { id: 'software', label: 'Applications', icon: Layers },
        { id: 'users', label: 'User Governance', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    : [
        { id: 'software', label: 'Applications', icon: Layers },
      ];

  const sidebarWidth = isCollapsed ? '80px' : '265px';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 16, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 90,
          }}
          onClick={onClose}
        />
      )}

      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 95,
          backgroundColor: 'var(--bg-glass, rgba(7, 11, 23, 0.95))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isCollapsed ? '24px 12px' : '24px 16px',
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), padding 0.28s ease',
        }}
        className={`portal-sidebar ${isOpen ? 'mobile-open' : ''}`}
      >
        {/* Brand Header */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: '6px 4px',
              marginBottom: '26px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate('software')}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), 0 0 10px rgba(255, 255, 255, 0.2)',
                  overflow: 'hidden',
                  padding: '3px',
                  flexShrink: 0,
                }}
              >
                <img
                  src={logoImg}
                  alt="PixxTechnologies"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    display: 'block',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {!isCollapsed && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    <span
                      style={{
                        fontSize: '9.5px',
                        background: 'rgba(53, 214, 255, 0.12)',
                        color: 'var(--cyan-accent, #35D6FF)',
                        border: '1px solid rgba(53, 214, 255, 0.25)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      PORTAL
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', letterSpacing: '0.04em' }}>
                    Central Access Hub
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '5px',
                  color: 'var(--text-muted, #64748B)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="desktop-collapse-btn"
                title="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Expand Button when collapsed */}
          {isCollapsed && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Navigation Menu */}
          <nav>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted, #64748B)',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  padding: '0 8px',
                  marginBottom: '10px',
                }}
              >
                Navigation
              </div>
            )}

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', padding: 0 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                        if (onClose) onClose();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '12px',
                        padding: isCollapsed ? '12px' : '11px 14px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 500,
                        backgroundColor: isActive
                          ? 'rgba(53, 214, 255, 0.12)'
                          : 'transparent',
                        color: isActive ? 'var(--cyan-accent, #35D6FF)' : 'var(--text-secondary, #A5B1C8)',
                        border: isActive
                          ? '1px solid rgba(53, 214, 255, 0.28)'
                          : '1px solid transparent',
                        transition: 'all 0.18s ease',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = 'var(--text-primary, #F5F7FF)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary, #A5B1C8)';
                        }
                      }}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={19} color={isActive ? 'var(--cyan-accent, #35D6FF)' : 'var(--text-muted, #64748B)'} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom Status Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              padding: isCollapsed ? '10px 4px' : '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-base, #0B1021)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isBackendOnline ? '#10B981' : '#F59E0B',
                  boxShadow: `0 0 8px ${isBackendOnline ? '#10B981' : '#F59E0B'}`,
                }}
              />
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #F5F7FF)' }}>
                    {isBackendOnline ? 'API Operational' : 'API Standby'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748B)' }}>
                    Node/Express :5000
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && <Server size={15} color="var(--text-muted, #64748B)" />}
          </div>

          {!isCollapsed && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted, #64748B)',
                textAlign: 'center',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              PixxTech Portal • Phase 4 3D
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .desktop-collapse-btn {
            display: none !important;
          }
          .portal-sidebar {
            position: fixed !important;
            transform: translateX(-100%);
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.85);
            width: 265px !important;
          }
          .portal-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
