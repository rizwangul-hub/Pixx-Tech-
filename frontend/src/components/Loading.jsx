import React from 'react';

/**
 * Reusable Loading Spinner Component
 */
const Loading = ({ message = 'Loading...', size = 'md' }) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';
  const dim = isSmall ? 24 : isLarge ? 56 : 38;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSmall ? '12px' : '36px',
        gap: '14px',
      }}
    >
      <div
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          borderRadius: '50%',
          border: '3px solid rgba(56, 189, 248, 0.12)',
          borderTopColor: '#38bdf8',
          borderRightColor: '#818cf8',
          animation: 'spin 0.9s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite',
        }}
      />
      {message && (
        <p style={{ fontSize: isSmall ? '12px' : '14px', color: '#94a3b8', margin: 0 }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading;
