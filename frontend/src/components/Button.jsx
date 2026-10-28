import React from 'react';

/**
 * Reusable Premium Button Component
 */
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'glow' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        };
      case 'glow':
        return {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
      case 'secondary':
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#e2e8f0',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(8px)',
        };
      case 'danger':
        return {
          background: 'rgba(244, 63, 94, 0.12)',
          color: '#fda4af',
          border: '1px solid rgba(244, 63, 94, 0.3)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: '#94a3b8',
          border: '1px solid transparent',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 14px', fontSize: '13px', borderRadius: '8px', gap: '6px' };
      case 'lg':
        return { padding: '14px 28px', fontSize: '16px', borderRadius: '14px', gap: '10px' };
      default:
        return { padding: '10px 20px', fontSize: '14px', borderRadius: '10px', gap: '8px' };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        letterSpacing: '0.01em',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={`pixx-btn ${className}`}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg
            style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 17} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 17} />}
        </>
      )}
    </button>
  );
};

export default Button;
