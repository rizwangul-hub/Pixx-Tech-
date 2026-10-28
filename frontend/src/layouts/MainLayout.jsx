import React from 'react';
import Navbar from './Navbar';

/**
 * Enterprise Application Shell Layout
 * Full-width, clean desktop/mobile presentation without sidebar clutter.
 */
const MainLayout = ({ 
  children, 
  currentPage, 
  onNavigate, 
  isBackendOnline, 
  searchQuery, 
  onSearch,
  isViewingApp = false,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-darkest)' }}>
      {/* Ambient Radial Lights */}
      {!isViewingApp && <div className="portal-ambient-bg" />}

      {/* Top Navbar - Hidden when viewing an application full screen */}
      {!isViewingApp && (
        <Navbar
          searchQuery={searchQuery}
          onSearch={onSearch}
          onNavigate={onNavigate}
          currentPage={currentPage}
        />
      )}

      {/* Main Content Area - Expands to 100vw / 100vh when viewing an application */}
      <main
        style={
          isViewingApp
            ? {
                flex: 1,
                padding: 0,
                maxWidth: '100vw',
                width: '100vw',
                height: '100vh',
                margin: 0,
                overflow: 'hidden',
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
              }
            : {
                flex: 1,
                padding: '28px 32px',
                maxWidth: '1440px',
                width: '100%',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1,
              }
        }
        className={isViewingApp ? 'portal-app-full-container' : 'portal-main-container'}
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 640px) {
          .portal-main-container {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
