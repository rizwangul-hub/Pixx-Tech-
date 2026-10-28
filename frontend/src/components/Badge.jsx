import React from 'react';

/**
 * Reusable Badge Component for statuses, categories and environments
 */
const Badge = ({
  children,
  variant = 'cyan', // 'cyan' | 'violet' | 'blue' | 'emerald' | 'amber' | 'neutral'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = '',
  style = {},
}) => {
  const getColors = () => {
    switch (variant) {
      case 'cyan':
        return {
          bg: 'rgba(6, 182, 212, 0.1)',
          text: '#22d3ee',
          border: 'rgba(6, 182, 212, 0.28)',
          dot: '#06b6d4',
        };
      case 'violet':
        return {
          bg: 'rgba(139, 92, 246, 0.1)',
          text: '#c084fc',
          border: 'rgba(139, 92, 246, 0.28)',
          dot: '#8b5cf6',
        };
      case 'blue':
        return {
          bg: 'rgba(56, 189, 248, 0.1)',
          text: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.28)',
          dot: '#38bdf8',
        };
      case 'emerald':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          text: '#34d399',
          border: 'rgba(16, 185, 129, 0.28)',
          dot: '#10b981',
        };
      case 'amber':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          text: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.28)',
          dot: '#f59e0b',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          text: '#94a3b8',
          border: 'rgba(255, 255, 255, 0.1)',
          dot: '#94a3b8',
        };
    }
  };

  const colors = getColors();
  const isSmall = size === 'sm';

  return (
    <span
      className={`pixx-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isSmall ? '2px 8px' : '4px 12px',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        borderRadius: '999px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: colors.dot,
            boxShadow: `0 0 6px ${colors.dot}`,
          }}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
