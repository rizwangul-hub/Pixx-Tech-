import React, { useState } from 'react';

/**
 * Reusable Accessible Tooltip Component
 */
const Tooltip = ({ children, text, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' };
      default: // top
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 100,
            padding: '6px 12px',
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            ...getPositionStyle(),
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
