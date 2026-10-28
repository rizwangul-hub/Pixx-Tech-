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
  onSearch 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-darkest)' }}>
      {/* Ambient Radial Lights */}
      <div className="portal-ambient-bg" />

      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearch={onSearch}
        onNavigate={onNavigate}
        currentPage={currentPage}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          padding: '28px 32px',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
        className="portal-main-container"
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
